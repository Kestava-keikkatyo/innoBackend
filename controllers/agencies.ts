/** Express router providing Agency-related routes
 * @module controllers/agencies
 * @requires express
 */

/**
 * Express router to mount Agency-related functions on.
 * @type {object}
 * @const
 * @namespace agenciesRouter
*/
import express, {NextFunction, Request, Response} from 'express'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import authenticateToken from "../utils/auhenticateToken"
import Agency from "../models/Agency"
import { IAgency, IAgencyDocument } from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";
import { needsToBeBusinessOrWorker } from '../utils/middleware'

const agenciesRouter = express.Router()


/**
 * @openapi
 * /agencies:
 *   post:
 *     summary: Route for registering a new agency account
 *     description: Returns a token that works like the token given when logging in.
 *     tags: [Agency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               name: John Doe
 *               email: example.email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           New agency created.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "400":
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 */
agenciesRouter.post("/", async (req: Request<unknown, unknown, IAgency>, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    const passwordLength: number = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res
        .status(400)
        .json({ message: "Password length less than 3 characters" })
    }
    const saltRounds: number = 10
    const passwordHash: string = await bcrypt.hash(body.password, saltRounds)

    const agencyToCreate: IAgencyDocument = new Agency({
      name: body.name,
      email: body.email,
      passwordHash,
    })
    const agency: IAgencyDocument = await agencyToCreate.save() // TODO use callback and check for errors

    const agencyForToken = {
      email: agency.email,
      id: agency._id,
    }

    const token: string = jwt.sign(agencyForToken, process.env.SECRET || '')

    return res
      .status(200)
      .send({ token, name: agency.name, email: agency.email, role: "agency" })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /agencies/me:
 *   get:
 *     summary: Route for agency to get their own info
 *     tags: [Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the agency object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agency"
 *       "401":
 *         description: Incorrect token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Not authorized
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agenciesRouter.get("/me", authenticateToken, (_req: Request, res: Response, next: NextFunction) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta (res.locals.decoded)
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    Agency.findById(res.locals.decoded.id,
      undefined,
      undefined,
      (error: CallbackError, result: IAgencyDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) { //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
          return res.status(401).send({ message: "Not authorized" })
        } else {
          return res.status(200).send(result)
        }
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route used to update agency's information.
 * @openapi
 * /agencies:
 *   put:
 *     summary: Route for agency to update their own info. For example password.
 *     tags: [Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     requestBody:
 *       description: |
 *         Any properties that want to be updated are given in request body.
 *         Properties can be any updatable property in the agency object.
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               password: newPass
 *               securityOfficer: Uusi Heebo
 *     responses:
 *       "200":
 *         description: Agency information updated. Returns updated agency.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agency"
 *       "400":
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 *       "404":
 *         description: Agency wasn't found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Agency not found
 */
agenciesRouter.put("/", authenticateToken, async (req: Request<unknown, unknown, IAgency>, res: Response, next: NextFunction) => {
  const { body } = req
  let passwordHash: string | undefined

  try {
    // Salataan uusi salasana
    if (body.password) {
      const passwordLength: number = body.password ? body.password.length : 0
      if (passwordLength < 3) {
        return res
          .status(400)
          .json({ message: "Password length less than 3 characters" })
      }
      const saltRounds: number = 10
      passwordHash = await bcrypt.hash(body.password, saltRounds)
    }

    // Poistetaan passwordHash bodysta
    // (muuten uusi salasana menee sellaisenaan tietokantaan).
    // Salattu salasana luodaan ylempänä.
    delete body.passwordHash

    // päivitetään bodyn kentät (mitä pystytään päivittämään).
    // lisätään passwordHash päivitykseen, jos annetaan uusi salasana.
    const updateFields = {
      ...body,
      passwordHash
    }

    // https://mongoosejs.com/docs/tutorials/findoneandupdate.html
    // https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
    const updatedAgency: IAgencyDocument | null = await Agency.findByIdAndUpdate(res.locals.decoded.id, updateFields, // TODO use callback for proper error handling
      { new: true, omitUndefined: true, runValidators: true })

    if (!updatedAgency) {
      return res.status(404).json({ message: "Agency not found" })
    }
    return res.status(200).json(updatedAgency)

  } catch (exception) {
    return next(exception)
  }
})

agenciesRouter.get("/", authenticateToken, needsToBeBusinessOrWorker, async (req: Request, res: Response, next: NextFunction) => {
  const { query } = req

  let name: string | undefined
  if (query.name) {
    name = query.name as string
  }
  try {   
      const agencies: Array<IAgencyDocument> = await Agency.find({ name: { $regex: name, $options: "i" } }, { name: 1, email: 1, businessContracts: 1 }) // TODO use callback for result and errors.
      if (agencies) {
        return res.status(200).json(agencies)
      }
    return res.status(404).json({ message: "Agency not found testi" })
  } catch (exception) {
    return next(exception)
  }
})


export default agenciesRouter
