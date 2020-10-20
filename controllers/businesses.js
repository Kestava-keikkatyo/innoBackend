const businessesRouter = require('express').Router()
const bcrypt = require('bcryptjs')
const Business = require('../models/Business')

businessesRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const business = new Business({
      name: body.name,
      username: body.username,
      email: body.email,
      city: body.city,
      postnumber: body.postnumber,
      address: body.address,
      phonenumber: body.phonenumber,
      passwordHash,
    })
    // https://mongoosejs.com/docs/api.html#model_Model.exists
    // Same as MyModel.exists({ answer: 42 }) is equivalent to MyModel.findOne({ answer: 42 }).select({ _id: 1 }).lean().then(doc => !!doc)
    const doesBusinessExist = await Business.exists({ name: body.name })
    const doesEmailExist = await Business.exists({ email: body.email })

    if (doesBusinessExist) {
      return response.status(401).json({
        error: 'Business exists already',
      })
    }

    if (doesEmailExist) {
      return response.status(401).json({
        error: 'Email exists already',
      })
    }
    const savedBusiness = await business.save()

    response.json(savedBusiness)
  } catch (exception) {
    next(exception)
  }
})

module.exports = businessesRouter
