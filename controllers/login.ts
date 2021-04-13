import express, {Request, Response} from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"
import {IAgencyDocument, IBusinessDocument, IWorkerDocument} from "../objecttypes/modelTypes";
import {IBodyLogin} from "../objecttypes/otherTypes";

const loginRouter = express.Router()

loginRouter.post("/worker", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const worker: IWorkerDocument | null = await Worker.findOne({ email: body.email })
  const passwordCorrect: boolean = worker === null
    ? false
    : await bcrypt.compare(body.password, worker.passwordHash as string)

  if (!(worker && passwordCorrect)) {
    return res.status(401).json({ error: "invalid email or password" })
  }

  const workerForToken = {
    email: worker.email,
    id: worker._id,
  }
  const token: string = jwt.sign(workerForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: worker.name, email: worker.email, role: "worker" })
})

loginRouter.post("/business", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const business: IBusinessDocument | null = await Business.findOne({ email: body.email })
  const passwordCorrect: boolean = business === null
    ? false
    : await bcrypt.compare(body.password, business.passwordHash as string)

  if (!(business && passwordCorrect)) {
    return res.status(401).json({ error: "invalid email or password" })
  }

  const businessForToken = {
    email: business.email,
    id: business._id,
  }

  const token: string = jwt.sign(businessForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: business.name, email: business.email, role: "business" })
})

loginRouter.post("/agency", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const agency: IAgencyDocument | null = await Agency.findOne({ email: body.email })
  const passwordCorrect: boolean = agency === null
    ? false
    : await bcrypt.compare(body.password, agency.passwordHash as string)

  if (!(agency && passwordCorrect)) {
    return res.status(401).json({ error: "invalid email or password" })
  }

  const agencyForToken = {
    email: agency.email,
    id: agency._id,
  }
  const token: string = jwt.sign(agencyForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: agency.name, email: agency.email, role: "agency" })
})

export default loginRouter