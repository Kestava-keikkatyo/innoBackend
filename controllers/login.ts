import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"

const loginRouter = express.Router()

loginRouter.post("/worker", async (request, response) => {
  const body = request.body
  const worker: any = await Worker.findOne({ email: body.email })
  const passwordCorrect = worker === null
    ? false
    : await bcrypt.compare(body.password, worker.passwordHash)

  if (!(worker && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid email or password"
    })
  }

  const workerForToken = {
    email: worker.email,
    id: worker._id,
  }
  const token = jwt.sign(workerForToken, process.env.SECRET || '')

  return response
    .status(200)
    .send({ token, name: worker.name, email: worker.email, role: "worker" })
})

loginRouter.post("/business", async (request, response) => {
  const body = request.body

  const business: any = await Business.findOne({ email: body.email })
  const passwordCorrect = business === null
    ? false
    : await bcrypt.compare(body.password, business.passwordHash)

  if (!(business && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid email or password"
    })
  }
  const businessForToken = {
    email: business.email,
    id: business._id,
  }

  const token = jwt.sign(businessForToken, process.env.SECRET || '')

  return response
    .status(200)
    .send({ token, name: business.name, email: business.email, role: "business" })
})

loginRouter.post("/agency", async (request, response) => {
  const body = request.body
  const agency: any = await Agency.findOne({ email: body.email })
  const passwordCorrect = agency === null
    ? false
    : await bcrypt.compare(body.password, agency.passwordHash)

  if (!(agency && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid email or password"
    })
  }

  const agencyForToken = {
    email: agency.email,
    id: agency._id,
  }
  const token = jwt.sign(agencyForToken, process.env.SECRET || '')

  return response
    .status(200)
    .send({ token, name: agency.name, email: agency.email, role: "agency" })
})

export default loginRouter