const usersRouter = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/User')

/**
 * User registration.
 * Returns a token that is used for user log in.
 */
usersRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body
    const passwordLength = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return response.status(400).json({ error: 'password length less than 3 characters' })
    }
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    const userToCreate = new User({
      username: body.username,
      email: body.email,
      passwordHash,
    })
    const user = await userToCreate.save()

    const userForToken = {
      email: user.email,
      id: userToCreate._id,
    }

    const token = jwt.sign(userForToken, process.env.SECRET)

    response
      .status(200)
      .send({ token, username: userToCreate.username, email: userToCreate.email })
  } catch (exception) {
    next(exception)
  }
})

module.exports = usersRouter
