import express from 'express'
import authenticateToken from "../utils/auhenticateToken"
import User from "../models/User"
import BusinessContract from "../models/BusinessContract"
import WorkContract from "../models/WorkContract"
import { needsToBeWorker, needsToBeAgencyOrBusiness } from "../utils/middleware"
import { workerExists, workerExistsInContracts } from "../utils/common"
import { SetFields } from 'mongodb'

const feelingsRouter = express.Router()
/**
 * Returns response.body: { The updated Worker object }
 * Route for user to add a feeling.
 * request.body requirements: {value: Int}. That is the minimum, can also be {value: Int, note: "note"}
 * Must be logged in as user.
 */
feelingsRouter.post("/", authenticateToken, needsToBeWorker, async (req, res, next) => {
  const { body } = req
  try {
    if (body.value !== undefined) {
      const fields: any = { feelings: [{ value: body.value, note: body.note }] }
      User.findByIdAndUpdate(
        // User id got from middleware.js. AddToSet adds 'value' and 'note' to feelings array. Note not added if undefined.
        res.locals.decoded.id,
        { $addToSet: fields },
        { new: true, omitUndefined: true, runValidators: true },
        (error: Error, result: any) => {
          if (!result || error) {
            res.status(401).send(error || { message: "Received no result when updating user" })
          } else {
            res.status(200).send({ value: body.value, note: body.note })
          }
        })
    } else {
      res.status(400).send({ error: "Request body must include 'value' field" })
    }

  } catch (exception) {
    return next(exception)
  }
})

/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for user to get a list of their feelings.
 * Must be logged in as user.
 */
feelingsRouter.get("/", authenticateToken, needsToBeWorker, async (req, res, next) => {
  const { query, body } = req
  try {
    const page: any = query.page
    const limit: any = query.limit
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    // Using Array.slice() to paginate feelings.
    res.status(200).send(body.worker.feelings.slice(page*limit-limit, page*limit))
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for agency/business to get a list of a worker's feelings they have a contract with.
 */
feelingsRouter.get("/:workerId", authenticateToken, needsToBeAgencyOrBusiness, async (req, res, next) => {
  const { query, params, body } = req

  try {
    const page: any = query.page
    const limit: any = query.limit
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }

    const workerId = params.workerId
    workerExists(workerId, (worker: any) => {
      if (!worker) {
        return res.status(404).send( { message: "Worker with ID " + workerId + " not found" })
      }
      if (body.agency) {
        // Check if agency has business contract with worker.
        const contractIds = body.agency.businessContracts
        workerExistsInContracts(BusinessContract, contractIds, workerId, (contracts: any) => {
          // In callback
          for (let i = 0; i < contracts.length; i++) {
            if (contracts[i].user && contracts[i].user.equals(workerId)) {
              if (contracts[i].contractMade) {
                // Contract with worker found, so agency is allowed to see worker feelings.
                // Using Array.slice() to paginate feelings.
                return res.status(200).send(worker.feelings.slice(page*limit-limit, page*limit))
              } else {
                // Contract found, but contractMade is false, so worker hasn't approved it yet.
                return res.status(403).send( { message: "Worker has yet to approve contract." })
              }
            }
          }
          // Contract with worker was not found. Not allowed to see feelings.
          res.status(403).send( { message: "Not allowed to see worker feelings if no contract has been made with them." })
        })

      } else if (body.business) {
        // Check if business has a work contract with worker.
        const contractIds = body.business.workContracts
        workerExistsInContracts(WorkContract, contractIds, workerId, (contracts: any) => {
          // In callback
          for (let i = 0; i < contracts.length; i++) {
            if (contracts[i].user && contracts[i].user.equals(workerId)) {
              if (Date.now() > contracts[i].validityPeriod.getTime()) {
                // Contract with worker found, so business is allowed to see worker feelings.
                // Using Array.slice() to paginate feelings.
                return res.status(200).send(worker.feelings.slice(page*limit-limit, page*limit))
              } else {
                // Contract found, but validityPeriod has passed, so contract is no longer valid.
                return res.status(403).send( { message: "Contract with worker has expired." })
              }
            }
          }
          // Contract with worker was not found. Not allowed to see feelings.
          return res.status(403).send( { message: "Not allowed to see worker feelings if no contract has been made with them." })
        })

      } else {
        return res.status(401).send( { message: "Not authorized" })
      }
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for worker to delete one of their own feelings by providing an id of that feeling as a parameter.
 */
feelingsRouter.delete("/:feelingId", authenticateToken, needsToBeWorker, async (req, res, next) => {
  const { params, body } = req

  try {
    let found: boolean | undefined
    for (const feeling of body.worker.feelings) {
      if (feeling._id.equals(params.feelingId)) {
        found = true
        User.findByIdAndUpdate(
          body.worker.id,
          { $pull: { feelings: { _id: params.feelingId } } },
          undefined,
          (error: Error, result: any) => {
            if (!result || error) {
              return res.status(500).send(error || { message: "Did not receive any result from database" })
            } else {
              return res.status(204).send()
            }
          })
      }
    }
    if (!found) {
      res.status(404).send({ message: `Could not find feeling with id ${params.feelingId}` })
    }
  } catch (exception) {
    next(exception)
  }
})

export default feelingsRouter