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
import express from 'express'
const logger = require("../utils/logger")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const authenticateToken = require("../utils/auhenticateToken")
const utils = require("../utils/common")
const Agency = require("../models/Agency")
const { needsToBeAgency } = require("../utils/middleware")
import { Promise as _Promise } from "bluebird";
const User = require("../models/User")
const BusinessContract = require("../models/BusinessContract")

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
agenciesRouter.post("/", async (req, res, next) => {
  const { body } = req

  try {
    const passwordLength = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res
        .status(400)
        .json({ error: "password length less than 3 characters" })
    }
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const agencyToCreate = new Agency({
      name: body.name,
      email: body.email,
      passwordHash,
    })
    const agency = await agencyToCreate.save()

    const agencyForToken = {
      email: agency.email,
      id: agency._id,
    }

    const token = jwt.sign(agencyForToken, process.env.SECRET)

    res
      .status(200)
      .send({ token, name: agency.name, email: agency.email, role: "agency" })
  } catch (exception) {
    next(exception)
  }
})

/**
 * @name get/me
 * @function
 * @memberof module:controllers/agencies~agenciesRouter
 * @inner
 */
agenciesRouter.get("/me", authenticateToken, (_req, res, next) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    const decoded = res.locals.decoded
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    Agency.findById({ _id: decoded.id }, (error: Error, result: any) => {
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
 * Get route for agency to get all agencys Workers.
 * Return just an array of workerIds who belong to this Agency.
 * @returns Array of WorkerIds
 */
agenciesRouter.get("/workerIds", authenticateToken, needsToBeAgency, (req, res, next) => {
  const { body } = req

  try {
    logger.info("Agency users: " + body.agency.users)
    return res
      .status(200)
      .json(body.agency.users)
  } catch (exception) {
    next(exception)
  }
})

/**
 * @deprecated Workers are not listed under Agency/Business anymore: Workers are connected to Business/Agency through business/workcontracts
 * Return an array of full worker objects who belong to this Agency
 */
agenciesRouter.get("/workers", authenticateToken, needsToBeAgency, (req, res, next) => {
  const { body } = req

  try {
    let workerArray: any = []
    logger.info("Populating array with " + body.agency.users.length + " workers.")
    _Promise.map(body.agency.users, (workerId) => {
      // Promise.map awaits for returned promises as well.
      return User.findById({ _id: workerId }, (error: Error, result: any) => {
        if (!result || error) {
          return res.status(500).send(error || { message: "Agency with ID " + body.agency._id + " has a Worker with ID " + result._id + " but it does not exist!" })
        } else {
          workerArray.push(result)
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
agenciesRouter.put("/", authenticateToken, async (req, res, next) => {
  const { body } = req
  const decoded = res.locals.decoded
  let passwordHash

  try {
    // Salataan uusi salasana
    if (body.password) {
      const passwordLength = body.password ? body.password.length : 0
      if (passwordLength < 3) {
        return res
          .status(400)
          .json({ error: "Password length less than 3 characters" })
      }
      const saltRounds = 10
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
    const updatedAgency = await Agency.findByIdAndUpdate(decoded.id, updateFields,
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
agenciesRouter.post("/workers", authenticateToken, needsToBeAgency, (req, res, next) => {
  const { body } = req
  // needsToBeAgency middleware saves Agency object to request.agency
  let agencyId = body.agency._id

  try {
    // Adding a single worker
    if (body.worker) {
      let workerId = body.worker
      // addToSet operation adds an item to a mongoose array, if that item is not already present.
      if (utils.workerExists(workerId, next)) {
        Agency.findOneAndUpdate(
        { _id: agencyId },
        { $addToSet: { users: [workerId] } },
        (error: Error, result: any) => {
          if (error || !result) {
            return res
              .status(400)
              .json({ error: "Could not add Worker with ID" + workerId + " into Agency with ID" + agencyId + "." })
          } else {
            // Added Worker to Agency, return resource URL
            return res
              .status(200)
              .json({ updated: domainUrl + agencyApiPath + agencyId, workersAdded: workerId })
          }
        })
      } else {
        return res
          .status(400)
          .json({ error: "Could not find Worker with ID " + workerId + "." })
      }

      // Adding several workers
    } else if (body.workers) {
      let workerIdsToAdd: any
      let workerIdsNotOk: any

      utils.whichWorkersExist(body.workers, next, (workerResult: any) => {
        workerIdsToAdd = workerResult.existingWorkerIds
        workerIdsNotOk = workerResult.nonExistingWorkerIds

        if (workerIdsToAdd && workerIdsToAdd.length > 0) {
          // $addToSet adds to mongoose array if the item does not already exist, thus eliminating duplicates.
          Agency.findOneAndUpdate(
          { _id: res.locals.decoded.id },
          { $addToSet: { users: workerIdsToAdd } },
          (error: Error, result: any) => {
            if (error || !result) {
              return res
                .status(400)
                .json({ error: "Could not add all Workers to Agency, so added none." })
            }
            // There were some ok worker ids to add
            return res
              .status(200)
              .header({ Location: domainUrl + agencyApiPath + agencyId + workersPath })
              .json({ success: true, workersAdded: workerIdsToAdd, workersNotAdded: workerIdsNotOk })
          })
        } else {
          return res
            .status(400)
            .json({ error: "All of the sent Worker Ids were either erronous or could not be matched with an existing worker." })
        }
      } )
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Returns res.body: { [{businessContract1}, {businessContract2},...] }
 * Requires user logged in as Agency.
 * Route for getting full data of all BusinessContracts that the logged in Agency has.
 * { [{businessContract1}, {businessContract2},...] }
 * @name GET /agencies/businesscontracts
 * @function
 * @memberof module:controllers/agencies~agenciesRouter
 * @inner
 */
agenciesRouter.get("/businesscontracts", authenticateToken, needsToBeAgency, async (req, res, next) => {
  const { body } = req
  const agency = body.agency
  try {
    if (!agency && !agency._id) return res.status(401) // No ID or Agency, respond with Unauthorized

    // TODO agencyId is not undefined since there is an empty array in db, so code'll get stuck here
    logger.info("Searching database for BusinessContracts: " + agency._id)
    const populatedAgency = await Agency.findById(agency._id).populate({
      path:"businessContracts", model: "BusinessContract",
      populate:
      [{
        path: "user",
        model: "User",
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
    logger.error(exception)
    return next(exception)
  }
})

/**
 * TODO: foreach callback is synchronic so you cannot trust the order the array is actually handled. Fix with regular for loop
 * A quality of life method which should maybe be removed later. Get all businesscontract info as an outsider, no validation yet. Should probably be updated to
 * "return businesscontracts in this Agency, that I am involved in"
 */
agenciesRouter.get("/:agencyId/businesscontracts", authenticateToken, async (req, res, next) => {
  try {
    const agencyId = req.params.agencyId
    logger.info("Finding BusinessContracts for Agency " + agencyId)
    Agency.findById(req.params.agencyId, (error: Error, agency: any) => {
      if (error || !agency) {
        return res
          .status(404)
          .json({ message: "Could not find Agency ID " + agencyId })
      } else {
        const contractIds = agency.businessContracts
        let temp: any
        let contracts: any = []
        if (contractIds) { // TODO contractIds is not undefined since there is an empty array in db, so code'll get stuck here
          logger.info("Searching database for BusinessContracts: " + contractIds)
          // Go through every contractId and, find contract data and push it to array "contracts".
          contractIds.forEach(async (contractId: string, index: number, contractIds: string[]) => {
            temp = await BusinessContract.findById(contractId).exec()
            logger.info("Current contract: " + temp)
            if (temp) {
              contracts.push(temp)
              temp = null
            }
            logger.info("Index: " + index)
            logger.info("contractIds.length" + contractIds.length)
            if (index === contractIds.length-1) { // If this was the last contract to find, send Response
              logger.info("BusinessContracts to Response: " + contracts)
              return res
                .status(200)
                .json(contracts)
            }
          })
        } else { // No contractIds in Agency, respond with empty array
          return res
            .status(200)
            .json(contracts)
        }
      }
    })
  } catch (exception) {
    logger.error(exception)
    return next(exception)
  }
})

/**
 * Pop the last added businessContract from Agency
 */
agenciesRouter.put("/businesscontracts", authenticateToken, needsToBeAgency, async (req, res, next) => {
  const { body } = req

  try {
    if (body.agency.businessContracts) {
      body.agency.businessContracts.pop()
      body.agency.save((error: Error, result: any) => {
        if (error || !result) {
          return res
            .status(500)
            .json({ message: "Unable to save Agency object." })
        } else {
          return res
            .status(200)
            .json({ message: "Last businessContract popped." })
        }
      })
    }

  } catch (exception) {
    logger.error(exception.message)
    return next(exception)
  }
})

export default agenciesRouter
