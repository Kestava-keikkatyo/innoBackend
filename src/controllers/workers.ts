/** Express router providing Worker-related routes
 * @module controllers/workers
 * @requires express
 */

/**
 * Express router to mount Worker-related functions on.
 * @type {object}
 * @const
 * @namespace workersRouter
*/
import express, {NextFunction, Request, Response} from "express"
import { hash } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { info, error as _error } from "../utils/logger"
import authenticateToken from "../utils/auhenticateToken"

import Worker from "../models/Worker"
import Agency from "../models/Agency"
import BusinessContract from "../models/BusinessContract"
import { needsToBeWorker } from "../utils/middleware"
import {IAgencyDocument, IBusinessContractDocument, IWorker, IWorkerDocument} from "../objecttypes/modelTypes";
import {CallbackError, DocumentDefinition, Types} from "mongoose";
import {IBaseBody} from "../objecttypes/otherTypes";


const workersRouter = express.Router()

/**
 * req.body requirements: {name: "name", email: "email", password: "password"}
 * Route used for Worker registration.
 * Returns a token that is used for worker log in.
 * @name POST /workers
 * @function
 * @memberof module:controllers/workers~workersRouter
 * @inner
 * @returns {JSON} response.body: { token, name: worker.name, email: worker.email, role: "worker" }
 */
workersRouter.post("/", async (req: Request<unknown, unknown, IWorker>, res: Response, next: NextFunction) => {
  try {
    const { body } = req
    const passwordLength: number = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res.status(400).json({ error: "Password length less than 3 characters" })
    }
    const saltRounds: number = 10
    const passwordHash: string = await hash(body.password, saltRounds)
    const workerToCreate: IWorkerDocument = new Worker({
      name: body.name,
      email: body.email,
      passwordHash,
    })
    const worker: IWorkerDocument = await workerToCreate.save() //TODO use callback and check for errors

    const workerForToken = {
      email: worker.email,
      id: workerToCreate._id,
    }

    const token: string = sign(workerForToken, process.env.SECRET || '')

    res.status(200).send({ token, name: worker.name, email: worker.email, role: "worker" })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route used to find worker with decoded authenticateToken.
 * Requires user logged in as a Worker
 * @name GET /workers/me
 * @function
 * @memberof module:controllers/workers~workersRouter
 * @inner
 * @returns {JSON} res.body: { The found Worker object }
 */
workersRouter.get("/me", authenticateToken, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    //Tokeni pitää sisällään workerid jolla etsitään oikean käyttäjän tiedot
    Worker.findById(res.locals.decoded.id,
      undefined,
      { lean: true },
      (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
      //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
      if (!result || error) {
        res.status(401).send(error || { message: "Not authorized" })
      } else {
        res.status(200).send(result)
      }
    })
  } catch (exception) {
    next(exception)
  }
})

/**
 * Route used to update workers password.
 * Requires user logged in as a Worker. req.body OPTIONAL: Properties as per Worker model.
 * @name PUT /workers
 * @function
 * @memberof module:controllers/workers~workersRouter
 * @inner
 * @returns {JSON} res.body: { The found Worker object }
 */
workersRouter.put("/", authenticateToken, async (req: Request<unknown, unknown, IWorker>, res: Response, next: NextFunction) => {
  const { body } = req
  let passwordHash: string | undefined

  try {
    // Salataan uusi salasana
    if (body.password) {
      const passwordLength: number = body.password ? body.password.length : 0
      if (passwordLength < 3) {
        return res.status(400).json({ error: "password length less than 3 characters" })
      }
      const saltRounds: number = 10
      passwordHash = await hash(body.password, saltRounds)
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
    const updatedWorker: IWorkerDocument | null = await Worker.findByIdAndUpdate(res.locals.decoded.id, updateFields,
      { new: true, omitUndefined: true, runValidators: true })

    if (!updatedWorker) {
      return res.status(400).json({ error: "Worker not found" })
    }
    return res.status(200).json(updatedWorker)

  } catch (exception) {
    return next(exception)
  }
})

/**
 * Requires user logged in as an Agency. req.query.name: Worker name to be searched
 * Retrieves all workers that have a matching name pattern.
 * @example
 * http://localhost:3001/api/workers?name=jarmo
 * @name GET /workers
 * @function
 * @memberof module:controllers/workers~workersRouter
 * @inner
 * @returns {JSON} res.body: { List of workers }
 */
workersRouter.get("/", authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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
      const workers: Array<IWorkerDocument> = await Worker.find({ name: { $regex: name, $options: "i" } }, { licenses: 0 })
      if (workers) {
        return res.status(200).json(workers)
      }
    }
    return res.status(400).json({ error: "Workers not found" })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Requires user logged in as a Worker.
 * Route for getting full data of all BusinessContracts that the logged in Worker has.
 * @name GET /workers/businesscontracts
 * @function
 * @memberof module:controllers/workers~workersRouter
 * @inner
 * @returns {JSON} response.body: { [{businessContract1}, {businessContract2},...] }
 */
workersRouter.get("/businesscontracts", authenticateToken, needsToBeWorker, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req
  let contractIds: Array<Types.ObjectId> | undefined
  if (body.worker) {
    contractIds = body.worker.businessContracts as Array<Types.ObjectId>
  }
  let contracts: Array<IBusinessContractDocument> = []
  let temp: IBusinessContractDocument | null
  try {
    if (contractIds) {
      info("Searching database for BusinessContracts: " + contractIds)
      // Go through every contractId and, find contract data and push it to array "contracts".
      contractIds.forEach(async (contractId: Types.ObjectId, index: number, contractIds: Array<Types.ObjectId>) => {
        temp = await BusinessContract.findById(contractId).exec()
        if (temp) {
          contracts.push(temp)
          temp = null
        }

        if (index === contractIds.length-1) { // If this was the last contract to find, send res
          info("BusinessContracts to Response: " + contracts)
          res.status(200).json(contracts)
        }
      })
    } else { // No contractIds in Worker, respond with empty array
      return res.status(200).json(contracts)
    }
  } catch (exception) {
    _error(exception)
    return next(exception)
  }
})

export default workersRouter