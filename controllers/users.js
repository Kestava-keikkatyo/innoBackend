const usersRouter = require("express").Router();
const bcrypt = require('bcryptjs')
const User = require("../models/User");
const jwt = require("jsonwebtoken");

usersRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      email: body.email,
      passwordHash,
    })

    const savedUser = await user.save()
    
    response.json(savedUser)
  } catch (exception) {
    next(exception)
  }
})

module.exports = usersRouter