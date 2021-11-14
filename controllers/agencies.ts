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
import express, { NextFunction, Request, Response } from 'express'
import bcrypt, { hash } from "bcryptjs"
import jwt from "jsonwebtoken"
import authenticateToken from "../utils/auhenticateToken"
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import { IAgency, IAgencyDocument, IBusinessDocument, IWorkerDocument, IAdminDocument } from "../objecttypes/modelTypes";
import { CallbackError, } from "mongoose";
import { needsToBeBusinessOrWorker } from '../utils/middleware'
import BusinessContract from '../models/BusinessContract';
import { needsToBeAgency } from './../utils/middleware';
import Business from '../models/Business'
import Admin from '../models/Admin';
//import BusinessContract from '../models/BusinessContract';

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
 *       "409":
 *         description: Email is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Email is already registered
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agenciesRouter.post("/", async (req: Request<unknown, unknown, IAgency>, res: Response, next: NextFunction) => {
  const { body } = req

  const business: IBusinessDocument | null = await Business.findOne({ email: body.email })
  if (business) {
    return res.status(409).json({ message: `${body.email} is already registered!` })
  }

  const worker: IWorkerDocument | null = await Worker.findOne({ email: body.email })
  if (worker) {
    return res.status(409).json({ message: `${body.email} is already registered!` })
  }

  const admin: IAdminDocument | null = await Admin.findOne({ email: body.email })
  if (admin) {
    return res.status(409).json({ message: `${body.email} is already registered!` })
  }

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
      category: body.category,
      passwordHash,
    })

    return agencyToCreate.save((error: CallbackError, agency: IAgencyDocument) => {
      if (error) {
        return res.status(500).json({ message: error.message })
      }
      if (!agency) {
        return res.status(500).json({ message: "Unable to save agency document" })
      }

      const agencyForToken = {
        email: agency.email,
        id: agency._id,
      }

      const token: string = jwt.sign(agencyForToken, process.env.SECRET || '')

      return res.status(200).send({ token, name: agency.name, email: agency.email, role: "agency" })
    })

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

/**
 * @openapi
 * /agencies/all:
 *   get:
 *     summary: Route for buisnesses and workers to get all agencies
 *     description: Need to be logged in as buisness or worker.
 *     tags: [Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all agencies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Agency"
 *       "404":
 *         description: No agencies found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Agencies not found
 */
agenciesRouter.get("/all", authenticateToken, needsToBeBusinessOrWorker, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agencies: Array<IAgencyDocument> | null = await Agency.find({}, { name: 1, email: 1, businessContracts: 1, profile: 1, category: 1, userType: 1 }).populate('profile', {}) // TODO use callback for result and errors.
    if (agencies) {
      return res.status(200).json(agencies)
    }
    return res.status(404).json({ message: "Agencies not found" })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /agencies/myworkers:
 *   get:
 *     summary: Route for agencies to get their workers
 *     description: Need to be logged in as an agency.
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
 *         description: Returns agency's workers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Workers"
 *       "404":
 *         description: No agencies found | No buisness contracts found | No workers found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Agency not found | Agency does not have buisness contracts | Agency does not have workers
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agenciesRouter.get("/myworkers", authenticateToken, needsToBeAgency, async (_req: Request, res: Response, next: NextFunction) => {

  try {
    // find the agency
    const agency: IAgencyDocument | null = await Agency.findById(res.locals.decoded.id)
    if (!agency) {
      return res.status(404).json({ message: "Agency not found!" })
    }
    return BusinessContract.aggregate([
      {
        $match: {
          "_id": agency.businessContracts[0]
        }
      },
      {
        $project: {
          "workerIds": "$madeContracts.workers.workerId",
          "_id": 0,
        }
      }
    ], async (error: CallbackError, businessContracts: any[]) => {
      if (error) {
        return res.status(500).json(error.message)
      }
      if (!businessContracts.length) {
        return res.status(404).json({ message: "Agency does not have buisness contracts!" })
      }
      return await Worker.find({ '_id': { $in: businessContracts[0].workerIds } }, (error: CallbackError, workers: Array<IWorkerDocument> | null) => {
        if (error) {
          return res.status(500).json(error.message)
        }
        if (!workers || !workers?.length) {
          return res.status(404).json({ message: "Agency does not have workers!" })
        }
        return res.status(200).json(workers)
      }).populate('profile', {});

    })
  } catch (exception) {
    return next(exception)
  }

  // ### Another way using populate ###
  /*
    try {
      // find the agency
      const agency: IAgencyDocument | null = await Agency.findById(res.locals.decoded.id)
      if(!agency){
        return res.status(404).json({message: "Agency not found!"})
      }
      const array = {_id: {$in: agency.businessContracts}}
      const populatePath: any = 'madeContracts.workers.workerId'
      const selectedFields:any = "name email profile businessContracts userType  createdAt"
      return BusinessContract.find(array,{},{ lean: true }).populate({path: populatePath, select: selectedFields }).exec((error:CallbackError, businessContracts: DocumentDefinition<IBusinessContractDocument>[]) => {
      if(error){
        return res.status(500).json(error.message)
      }
    if(!businessContracts.length){
        return res.status(404).json({message: "Agency does not have buisness contracts!"})
      }
      const workers: any = businessContracts[0].madeContracts.workers.map((item:any)=> item.workerId)
      // check if workers array is empty
      if(!workers.length){
        return res.status(404).json({message: "Agency does not have workers!"})
      }
        return res.status(200).json(workers)
      })

    } catch (exception) {
      return next(exception)
    }
  */

})


/**
 * @openapi
 * /agencies:
 *   get:
 *     summary: Route for businesses and workers to search for agencies by name
 *     description: Need to be logged in as business or worker.
 *     tags: [Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: name
 *         description: Agency name we want to search for
 *         required: true
 *         schema:
 *           type: string
 *           example: jarmo
 *     responses:
 *       "200":
 *         description: Returns found agencies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Agency"
 *       "404":
 *         description: No agencies found with a matching name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Agencies not found
 */
agenciesRouter.get("/", authenticateToken, needsToBeBusinessOrWorker, async (req: Request, res: Response, next: NextFunction) => {
  const { query } = req

  let name: string | undefined
  if (query.name) {
    name = query.name as string
  }
  try {
    if (name) {
      const agencies: Array<IAgencyDocument> = await Agency.find({ name: { $regex: name, $options: "i" } }, { name: 1, email: 1, businessContracts: 1, profile: 1, category: 1 }) // TODO use callback for result and errors.
      if (agencies) {
        return res.status(200).json(agencies)
      }
    } else {
      // if name is undefined or blank, return all agencies
      const agencies: Array<IAgencyDocument> = await Agency.find({}, { name: 1, email: 1, businessContracts: 1, profile: 1, category: 1 }) // TODO use callback for result and errors.
      if (agencies) {
        return res.status(200).json(agencies)
      }
    }
    return res.status(404).json({ message: "Agency not found testi" })
  } catch (exception) {
    return next(exception)
  }
})



/**
 * Route used to update agency's password.
 * @openapi
 * /agencies/update-password:
 *   put:
 *     summary: Route for agency to update their own password.
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
 *         Properties are the current password and the new password of the agency object.
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               currentPassword: currentPass123
 *               newPassword: newPass123
 *     responses:
 *       "200":
 *         description: Agency password updated. Returns updated agency.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agency"
 *       "401":
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Current password is incorrect
 *       "400":
 *         description: New password can't be blank
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: New password can't be blank
 *       "406":
 *         description: New password could not be as same as current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: New password could not be as same as current password
 *       "411":
 *         description: Incorrect password "Length required"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 6 characters
 *       "404":
 *         description: Agency wasn't found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Agency not found
 */
agenciesRouter.put("/update-password", authenticateToken, async (req: Request, res: Response, next: NextFunction) => {

  const { body } = req
  try {
    // find the agency
    const agency: IAgencyDocument | null = await Agency.findById(res.locals.decoded.id)
    // check if the current password is correct
    const currentPasswordCorrect: boolean = agency === null
      ? false
      : await bcrypt.compare(body.currentPassword, agency.passwordHash as string)

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" })
    }
    if (!currentPasswordCorrect) {
      return res.status(406).json({ message: "Current password is incorrect" })
    }
    if (body.currentPassword === body.newPassword) {
      return res.status(406).json({ message: "New password could not be as same as current password" })
    }
    if (!body.newPassword) {
      return res.status(406).json({ message: "New password can't be blank" })
    }

    let newPasswordHash: string | undefined

    // Salataan uusi salasana
    if (body.newPassword) {
      const passwordLength: number = body.newPassword ? body.newPassword.length : 0
      if (passwordLength < 6) {
        return res.status(411).json({ message: "Password length less than 6 characters" })
      }
      const saltRounds: number = 10
      newPasswordHash = await hash(body.newPassword, saltRounds)
    }

    // Poistetaan passwordHash bodysta
    // (muuten uusi salasana menee sellaisenaan tietokantaan).
    // Salattu salasana luodaan ylempänä.
    delete agency.passwordHash

    // update agency's passwordHash with the new passwordHash
    const updatePasswordField = {
      passwordHash: newPasswordHash
    }

    // https://mongoosejs.com/docs/tutorials/findoneandupdate.html
    // https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
    const updatedAgency: IAgencyDocument | null = await Agency.findByIdAndUpdate(res.locals.decoded.id, updatePasswordField,
      { new: true, omitUndefined: true, runValidators: true })

    if (!updatedAgency) {
      return res.status(404).json({ message: "Agency not found" })
    }
    return res.status(200).json(updatedAgency)

  } catch (exception) {
    return next(exception)
  }
})


export default agenciesRouter
