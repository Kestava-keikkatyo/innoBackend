/** Express router providing Business-related routes
 * @module controllers/businesses
 * @requires express
 */

/**
 * Express router to mount Business-related functions on.
 * @type {object}
 * @const
 * @namespace businessesRouter
*/
import express, {NextFunction, Request, Response} from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { error as _error } from "../utils/logger"
import Agency from "../models/Agency"
import Business from "../models/Business"
import authenticateToken from "../utils/auhenticateToken"
import {IAgencyDocument, IBusiness, IBusinessDocument} from "../objecttypes/modelTypes";
import {CallbackError, DocumentDefinition} from "mongoose";

const businessesRouter = express.Router()
/**
 * Returns response.body: { token, name: savedBusiness.name, email: savedBusiness.email, role: "business" }
 * request.body requirements: {name: "name", email: "email", password: "password"}
 * Route to create a new Business account.
 * @name POST /businesses
 * @function
 * @memberof module:controllers/businesses~businessesRouter
 * @inner
 */
businessesRouter.post("/", async (req: Request<unknown, unknown, IBusiness>, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    // This could be separated into a validation middleware
    const passwordLength: number = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res.status(400).json({ error: "password length less than 3 characters" })
    }
    const saltRounds: number = 10
    const passwordHash: string = await bcrypt.hash(body.password, saltRounds)

    const business: IBusinessDocument = new Business({
      name: body.name,
      email: body.email,
      passwordHash,
    })

    const savedBusiness: IBusinessDocument = await business.save() //TODO use callback and check for errors

    const businessForToken = {
      email: savedBusiness.email,
      id: savedBusiness._id,
    }

    const token: string = jwt.sign(businessForToken, process.env.SECRET || '')

    console.log("jwt token: " + token)
    //response.json(savedBusiness);
    return res.status(200).send({ token, name: savedBusiness.name, email: savedBusiness.email, role: "business" })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Returns response.body: { The found Business object }
 * Requires user logged in as a Business
 * Route to get Business information
 * @name GET /businesses/me
 * @function
 * @memberof module:controllers/businesses~businessesRouter
 * @inner
 */
businessesRouter.get("/me", authenticateToken, (_req: Request, res: Response, next: NextFunction) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    Business.findById(res.locals.decoded.id,
      undefined,
      { lean: true },
      (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
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
 * Returns response.body: { The updated Business object }
 * Requires user must be logged in as Business. request.body OPTIONAL: {property: "value", ....}. Properties need to match those of Business model in database.
 * Route to update Business information.
 * @name PUT /businesses/
 * @function
 * @memberof module:controllers/businesses~businessesRouter
 * @inner
 */
businessesRouter.put("/", authenticateToken, async (req: Request<unknown, unknown, IBusiness>, res: Response, next: NextFunction) => {
  const { body } = req
  let passwordHash: string | undefined

  try {
    // Salataan uusi salasana
    if (body.password) {
      const passwordLength: number = body.password ? body.password.length : 0
      if (passwordLength < 3) {
        return res.status(400).json({ error: "Password length less than 3 characters" })
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
    const updatedBusiness: IBusinessDocument | null = await Business.findByIdAndUpdate(res.locals.decoded.id, updateFields,
      { new: true, omitUndefined: true, runValidators: true })

    if (!updatedBusiness) {
      return res.status(400).json({ error: "Business not found" })
    }
    return res.status(200).json(updatedBusiness)

  } catch (exception) {
    return next(exception)
  }
})


businessesRouter.get("/", authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  const { query } = req

  let name: string | undefined
  if (query.name) {
    name = query.name as string
  }
  try {
    const agency: IAgencyDocument | null = await Agency.findById(res.locals.decoded.id)
    if (agency && name) {
      // Työntekijät haetaan SQL:n LIKE operaattorin tapaisesti
      // Työpassit jätetään hausta pois
      const users: Array<IBusinessDocument> = await Business.find({ name: { $regex: name, $options: "i" } }, { licenses: 0 }) // TODO use callback for result and errors.
      if (users) {
        return res.status(200).json(users)
      }
    }
    return res.status(400).json({ error: "Users not found" })
  } catch (exception) {
    return next(exception)
  }
})

export default businessesRouter
