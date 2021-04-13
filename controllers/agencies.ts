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
import { info, error as _error} from "../utils/logger"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import authenticateToken from "../utils/auhenticateToken"
import Agency from "../models/Agency"
import { needsToBeAgency } from "../utils/middleware"
import { Promise as _Promise } from "bluebird";
import Worker from "../models/Worker"
import BusinessContract from "../models/BusinessContract"
import { whichWorkersExist, workerExists } from '../utils/common'
import {IAgency, IAgencyDocument, IBusinessContractDocument, IWorkerDocument} from "../objecttypes/modelTypes";
import {CallbackError, DocumentDefinition, Types} from "mongoose";
import {IBaseBody} from "../objecttypes/otherTypes";

const agenciesRouter = express.Router()
const domainUrl = "http://localhost:3000/"
const agencyApiPath = "api/agencies/"

const workersPath = "workers/"

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

/** @deprecated Workers aren't stored in agencies anymore.
 * Get route for agency to get all agency's Workers.
 * Return just an array of workerIds who belong to this Agency.
 * @returns Array of WorkerIds
 */
agenciesRouter.get("/workerIds", authenticateToken, needsToBeAgency, (req: Request, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    info("Agency users: " + body.agency.users)
    return res
      .status(200)
      .json(body.agency.users)
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @deprecated Workers are not listed under Agency/Business anymore: Workers are connected to Business/Agency through business/workcontracts
 * Return an array of full worker objects who belong to this Agency
 */
agenciesRouter.get("/workers", authenticateToken, needsToBeAgency, (req: Request, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    let workerArray: any = []
    info("Populating array with " + body.agency.users.length + " workers.")
    _Promise.map(body.agency.users, (workerId) => {
      // Promise.map awaits for returned promises as well.
      Worker.findById({ _id: workerId }, (error: Error, result: any) => {
        if (!result || error) {
          return res.status(500).send(error || { message: "Agency with ID " + body.agency._id + " has a Worker with ID " + result._id + " but it does not exist!" })
        } else {
          return workerArray.push(result)
        }
      })
    }).then( () => {
      return res
        .status(200)
        .json({ workers: workerArray })
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

/**
 * @deprecated Workers are not listed under Agency/Business anymore: Workers are connected to Business/Agency through business/workcontracts
 * Route for adding workers to an Agency's list of workers
 * Example "http://www.domain.com/api/agencies/workers/" while logged in as an Agency
 * Request requirements: Body.workers / Body.worker
 * Workers are given as a json array of IDs: {"workers": ["id1","id2","id3"...]}
 * A single worker can also be given as json: {"worker":"id"}
 * Successful res.body: { success: true, workersAdded: [workerId1, id2...], workersNotAdded: [workerId1, id2...] }
 * res.header.Location: Url to this agency's workers resource
 */
agenciesRouter.post("/workers", authenticateToken, needsToBeAgency, (req: Request, res: Response, next: NextFunction) => {
  const { body } = req
  // needsToBeAgency middleware saves Agency object to request.agency
  let agencyId = body.agency._id

  try {
    // Adding a single worker
    if (body.worker) {
      let workerId = body.worker
      // addToSet operation adds an item to a mongoose array, if that item is not already present.

      workerExists(workerId, (worker: IWorkerDocument | null) => {
        if (worker) {
          Agency.findOneAndUpdate(
              { _id: agencyId },
              { $addToSet: { users: [workerId] } },
              undefined,
              (error: Error, result: any) => {
                if (error || !result) {
                  res.status(400).json({ error: "Could not add Worker with ID" + workerId + " into Agency with ID" + agencyId + "." })
                } else {
                  // Added Worker to Agency, return resource URL
                  res.status(200).json({ updated: domainUrl + agencyApiPath + agencyId, workersAdded: workerId })
                }
              })
        } else {
          res.status(400).json({ error: "Could not find Worker with ID " + workerId + "." })
        }
      })

      // Adding several workers
    } else if (body.workers) {
      let workerIdsToAdd: any
      let workerIdsNotOk: any

      //21.3. typescript-convertion: Deleted next argument
      whichWorkersExist(body.workers, (workerResult: any) => {
        workerIdsToAdd = workerResult.existingWorkerIds
        workerIdsNotOk = workerResult.nonExistingWorkerIds

        if (workerIdsToAdd && workerIdsToAdd.length > 0) {
          // $addToSet adds to mongoose array if the item does not already exist, thus eliminating duplicates.
          Agency.findOneAndUpdate(
          { _id: res.locals.decoded.id },
          { $addToSet: { users: workerIdsToAdd } },
          undefined,
          (error: Error, result: any) => {
            if (error || !result) {
              res
                .status(400)
                .json({ error: "Could not add all Workers to Agency, so added none." })
            } else {
              // There were some ok worker ids to add
              res
                .status(200)
                .header({ Location: domainUrl + agencyApiPath + agencyId + workersPath })
                .json({ success: true, workersAdded: workerIdsToAdd, workersNotAdded: workerIdsNotOk })
            }
          })
        } else {
          res
            .status(400)
            .json({ error: "All of the sent Worker Ids were either erroneous or could not be matched with an existing worker." })
        }
      } )
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @deprecated Returns res.body: { [{businessContract1}, {businessContract2},...] }
 * Requires user logged in as Agency.
 * Route for getting full data of all BusinessContracts that the logged in Agency has.
 * { [{businessContract1}, {businessContract2},...] }
 * @name GET /agencies/businesscontracts
 * @function
 * @memberof module:controllers/agencies~agenciesRouter
 * @inner
 */
agenciesRouter.get("/businesscontracts", authenticateToken, needsToBeAgency, async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req
  const agency = body.agency
  try {
    if (!agency && !agency._id) return res.status(401) // No ID or Agency, respond with Unauthorized

    // TODO agencyId is not undefined since there is an empty array in db, so code'll get stuck here
    info("Searching database for BusinessContracts: " + agency._id)
    const populatedAgency: any = await Agency.findById(agency._id).populate({
      path:"businessContracts", model: "BusinessContract",
      populate:
      [{
        path: "worker",
        model: "Workers",
        select: "name email feelings"
      },
      {
        path: "business",
        model: "Business",
        select: "name email feelings"
      }]
    }).exec()
    return res.status(200).json(populatedAgency.businessContracts)

  } catch (exception) {
    _error(exception)
    return next(exception)
  }
})

/**
 * TODO: foreach callback is synchronic so you cannot trust the order the array is actually handled. Fix with regular for loop
 * A quality of life method which should maybe be removed later. Get all businesscontract info as an outsider, no validation yet. Should probably be updated to
 * "return businesscontracts in this Agency, that I am involved in"
 */
agenciesRouter.get("/:agencyId/businesscontracts", authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agencyId: string = req.params.agencyId
    info("Finding BusinessContracts for Agency " + agencyId)
    Agency.findById(req.params.agencyId, (error: CallbackError, agency: IAgencyDocument) => {
      if (error || !agency) {
        return res.status(404).json({ message: "Could not find Agency ID " + agencyId })
      } else {
        const contractIds: Array<Types.ObjectId> = agency.businessContracts as Array<Types.ObjectId>
        let temp: IBusinessContractDocument | null
        let contracts: Array<IBusinessContractDocument> = []
        if (contractIds) { // TODO contractIds is not undefined since there is an empty array in db, so code'll get stuck here
          info("Searching database for BusinessContracts: " + contractIds)
          // Go through every contractId and, find contract data and push it to array "contracts".
          // TODO: Refactor to basic for-loop.
          return contractIds.forEach(async (contractId: Types.ObjectId, index: number, contractIds: Array<Types.ObjectId>) => {
            temp = await BusinessContract.findById(contractId).exec()
            info("Current contract: " + temp)
            if (temp) {
              contracts.push(temp)
              temp = null
            }
            info("Index: " + index)
            info("contractIds.length" + contractIds.length)
            if (index === contractIds.length-1) { // If this was the last contract to find, send Response
              info("BusinessContracts to Response: " + contracts)
              return res.status(200).json(contracts)
            }
            return
          })
        } else { // No contractIds in Agency, respond with empty array
          return res.status(200).json(contracts)
        }
      }
    })
  } catch (exception) {
    _error(exception)
    return next(exception)
  }
})

/** @deprecated Is this used anywhere?? // TODO
 * Pop the last added businessContract from Agency
 */
agenciesRouter.put("/businesscontracts", authenticateToken, needsToBeAgency, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    if (body.agency) {
      if (body.agency.businessContracts) {
        body.agency.businessContracts.pop()
        body.agency.save((error: CallbackError, result: IAgencyDocument) => {
          if (error || !result) {
            return res.status(500).json({message: "Unable to save Agency object."})
          } else {
            return res.status(200).json({message: "Last businessContract popped."})
          }
        })
      }
    }
    return res.status(500).send({ error: "Agency was for some reason undefined" })

  } catch (exception) {
    _error(exception.message)
    return next(exception)
  }
})

export default agenciesRouter
