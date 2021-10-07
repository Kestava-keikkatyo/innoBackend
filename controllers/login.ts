import express, { Request, Response } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"
import { IAdminDocument, IAgencyDocument, IBusinessDocument, IWorkerDocument } from "../objecttypes/modelTypes";
import { IBodyLogin } from "../objecttypes/otherTypes";
import Admin from "../models/Admin"

const loginRouter = express.Router()

/**
 * @openapi
 * /login/worker:
 *   post:
 *     summary: Route for logging in as a worker.
 *     description: Response provides a token used for authentication in most other calls.
 *     tags: [Worker, Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: example.email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           Logged in as a worker.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Invalid email or password
 */
loginRouter.post("/worker", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const worker: IWorkerDocument | null = await Worker.findOne({ email: body.email })
  const passwordCorrect: boolean = worker === null
    ? false
    : await bcrypt.compare(body.password, worker.passwordHash as string)

  if (!(worker && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const workerForToken = {
    email: worker.email,
    id: worker._id,
    role: "worker"
  }
  const token: string = jwt.sign(workerForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: worker.name, email: worker.email, role: "worker", profileId: worker.profile })
})

/**
 * @openapi
 * /login/business:
 *   post:
 *     summary: Route for logging in as a business
 *     description: Response provides a token used for authentication in most other calls.
 *     tags: [Business, Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: example.email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           Logged in as a business.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Invalid email or password
 */
loginRouter.post("/business", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const business: IBusinessDocument | null = await Business.findOne({ email: body.email })
  const passwordCorrect: boolean = business === null
    ? false
    : await bcrypt.compare(body.password, business.passwordHash as string)

  if (!(business && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const businessForToken = {
    email: business.email,
    id: business._id,
    role: "business"
  }

  const token: string = jwt.sign(businessForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: business.name, email: business.email, role: "business", profileId: business.profile })
})

/**
 * @openapi
 * /login/agency:
 *   post:
 *     summary: Route for logging in as an agency
 *     description: Response provides a token used for authentication in most other calls.
 *     tags: [Agency, Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: example.email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           Logged in as an agency.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Invalid email or password
 */
loginRouter.post("/agency", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const agency: IAgencyDocument | null = await Agency.findOne({ email: body.email })
  const passwordCorrect: boolean = agency === null
    ? false
    : await bcrypt.compare(body.password, agency.passwordHash as string)

  if (!(agency && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const agencyForToken = {
    email: agency.email,
    id: agency._id,
    role: "agency"
  }
  const token: string = jwt.sign(agencyForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: agency.name, email: agency.email, role: "agency", profileId: agency.profile })
})



/**
 * @openapi
 * /login/admin:
 *   post:
 *     summary: Route for logging in as a admin.
 *     description: Response provides a token used for authentication in most other calls.
 *     tags: [Admin, Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: example.email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           Logged in as an admin.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Invalid email or password
 */
 loginRouter.post("/admin", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  const admin: IAdminDocument | null = await Admin.findOne({ email: body.email })
  const passwordCorrect: boolean = admin === null
    ? false
    : await bcrypt.compare(body.password, admin.passwordHash as string)

  if (!(admin && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const adminForToken = {
    email: admin.email,
    id: admin._id,
    role: "worker"
  }
  const token: string = jwt.sign(adminForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: admin.name, email: admin.email, role: "admin", profileId: admin.profile })
})




/*loginRouter.post("/login", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req

  let user: IWorkerDocument | IBusinessDocument | IAgencyDocument | IAdminDocument | null = await Worker.findOne({ email: body.email })
  if (user == null)
    user = await Business.findOne({ email: body.email })
  if (user == null)
    user = await Agency.findOne({ email: body.email })
  if (user == null)
    user = await Admin.findOne({ email: body.email })
  const passwordCorrect: boolean = user === null
    ? false
    : await bcrypt.compare(body.password, user.passwordHash as string)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const workerForToken = {
    email: user.email,
    id: user._id,
    role: user.userType.toLowerCase()
  }
  const token: string = jwt.sign(workerForToken, process.env.SECRET || '')

  return res.status(200).send({ token, name: user.name, email: user.email, role: workerForToken.role, profileId: user.profile })
})*/


export default loginRouter