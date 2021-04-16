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
import { error as _error} from "../utils/logger"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import authenticateToken from "../utils/auhenticateToken"
import Agency from "../models/Agency"
import { Promise as _Promise } from "bluebird";
import {IAgency, IAgencyDocument} from "../objecttypes/modelTypes";
import {CallbackError, DocumentDefinition} from "mongoose";

const agenciesRouter = express.Router()


/**
 * Returns a token that is used for user log in.
 * Request requirements:
 * Body.email, Body.name, Body.password
 * @name POST /agencies
 * @function
 * @memberof module:controllers/agencies~agenciesRouter
 * @inner
 */
agenciesRouter.post("/", async (req: Request<unknown, unknown, IAgency>, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    const passwordLength: number = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res
        .status(400)
        .json({ error: "password length less than 3 characters" })
    }
    const saltRounds: number = 10
    const passwordHash: string = await bcrypt.hash(body.password, saltRounds)

    const agencyToCreate: IAgencyDocument = new Agency({
      name: body.name,
      email: body.email,
      passwordHash,
    })
    const agency: IAgencyDocument = await agencyToCreate.save() //TODO use callback and check for errors

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
 * @name get/me
 * @function
 * @memberof module:controllers/agencies~agenciesRouter
 * @inner
 */
agenciesRouter.get("/me", authenticateToken, (_req: Request, res: Response, next: NextFunction) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta (res.locals.decoded)
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    Agency.findById(res.locals.decoded.id,
      undefined,
      { lean: true },
      (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
      //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
      if (!result || error) {
        return res.status(401).send(error || { message: "Not authorized" })
      } else {
        return res.status(200).send(result)
      }
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route used to update agency new password.
 * @name PUT /agencies
 * @function
 * @memberof module:controllers/agencies~agenciesRouter
 * @inner
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
          .json({ error: "Password length less than 3 characters" })
      }
      const saltRounds: number = 10
      passwordHash = await bcrypt.hash(body.password, saltRounds)
    }

    // Poistetaan passwordHash bodysta
    // (muuten uusi salasana menee sellaisenaan tietokantaan).
    // Salattu salasana luodaan ylempänä.
    delete body.passwordHash

    // päivitetään bodyn kentät (mitä pystytään päivittämään, eli name ja phonenumber).
    // lisätään passwordHash päivitykseen, jos annetaan uusi salasana.
    const updateFields = {
      ...body,
      passwordHash
    }

    // https://mongoosejs.com/docs/tutorials/findoneandupdate.html
    // https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
    const updatedAgency: IAgencyDocument | null = await Agency.findByIdAndUpdate(res.locals.decoded.id, updateFields,
      { new: true, omitUndefined: true, runValidators: true })

    if (!updatedAgency) {
      return res.status(400).json({ error: "Agency not found" })
    }
    return res.status(200).json(updatedAgency)

  } catch (exception) {
    return next(exception)
  }
})


export default agenciesRouter
