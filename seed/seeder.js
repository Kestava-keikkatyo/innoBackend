const bcrypt = require("bcryptjs")
const data = require("./data.json")
const config = require("../utils/config")
const logger = require("../utils/logger")
const mongoose = require("mongoose")
const User = require("../models/User")
const Agency = require("../models/Agency")
const Business = require("../models/Business")

const getAgencySchema = (worker, hash) => new Agency({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const getBusinessSchema = (worker, hash) => new Business({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const getWorkerSchema = (worker, hash) => new User({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const createUser = async (user, type) => {
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(user.password, saltRounds)
  switch (type) {
  case "worker":
    getWorkerSchema(user, passwordHash).save()
    break
  case "business":
    getBusinessSchema(user, passwordHash).save()
    break
  case "agency":
    getAgencySchema(user, passwordHash).save()
    break
  default:
    break
  }
}

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info("connected to MongoDB")
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message)
  })

/**
 * TODO: Käyttäjien luomisen jälkeen halutaan disconnectaa
 */
data.worker.map(w => createUser(w, "worker"))
data.agency.map(a => createUser(a, "agency"))
data.business.map(b => createUser(b, "business"))

// Promise.all(res).then(() => {
//   logger.info("Database seeded. Disconnecting...")
//   mongoose.disconnect()
// })