import bcrypt from "bcryptjs"
import data from "./data.json"
import config from "../utils/config"
import logger from "../utils/logger"
import mongoose from "mongoose"
import Worker from "../models/Worker"
import Agency from "../models/Agency"
import Business from "../models/Business"
import Admin from "../models/Admin"

const getAgencySchema = (worker : any, hash : any) => new Agency({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const getBusinessSchema = (worker : any, hash : any) => new Business({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const getWorkerSchema = (worker : any, hash : any) => new Worker({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const getAdminSchema = (worker : any, hash : any) => new Admin({
  name: worker.name,
  email: worker.email,
  passwordHash: hash,
})

const createUser = async (user: { email: string; name: string; password: string }, type : string) => {
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
  case "admin":
    getAdminSchema(user, passwordHash).save()
    break
  default:
    break
  }
}

if (config.MONGODB_URI) {
  mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      logger.info("connected to MongoDB")
    })
    .catch((error) => {
      logger.error("error connection to MongoDB:", error.message)
    })
}

/**
 * TODO: Käyttäjien luomisen jälkeen halutaan disconnectaa
 */
data.worker.map(w => createUser(w, "worker"))
data.agency.map(a => createUser(a, "agency"))
data.business.map(b => createUser(b, "business"))
data.admin.map(ad => createUser(ad, "admin"))

// Promise.all(res).then(() => {
//   logger.info("Database seeded. Disconnecting...")
//   mongoose.disconnect()
// })