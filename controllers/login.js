const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const loginRouter = require('express').Router()
const User = require('../models/User')
const Business = require('../models/Business')
const Agency = require('../models/Agency')

loginRouter.post('/worker', async (request, response) => {
  const body = request.body
  const user = await User.findOne({ email: body.email })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(body.password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid email or password'
    })
  }

  const userForToken = {
    email: user.email,
    id: user._id,
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  response
    .status(200)
    .send({ token, name: user.name, email: user.email, role: 'worker' })
})

loginRouter.post('/business', async (request, response) => {
  const body = request.body

  const business = await Business.findOne({ email: body.email })
  const passwordCorrect = business === null
    ? false
    : await bcrypt.compare(body.password, business.passwordHash)

  if (!(business && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid email or password'
    })
  }
  const businessForToken = {
    email: business.email,
    id: business._id,
  }

  const token = jwt.sign(businessForToken, process.env.SECRET)

  response
    .status(200)
    .send({ token, name: business.name, email: business.email, role: 'business' })
})

loginRouter.post('/agency', async (request, response) => {
  const body = request.body
  const agency = await Agency.findOne({ email: body.email })
  const passwordCorrect = agency === null
    ? false
    : await bcrypt.compare(body.password, agency.passwordHash)

  if (!(agency && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid email or password'
    })
  }

  const agencyForToken = {
    email: agency.email,
    id: agency._id,
  }
  const token = jwt.sign(agencyForToken, process.env.SECRET)

  response
    .status(200)
    .send({ token, name: agency.name, email: agency.email, role: 'agency' })
})

module.exports = loginRouter