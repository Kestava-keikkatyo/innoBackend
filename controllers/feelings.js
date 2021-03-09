
const feelingsRouter = require("express").Router()
const authenticateToken = require("../utils/auhenticateToken")

const User = require("../models/User")
const BusinessContract = require("../models/BusinessContract")
const WorkContract = require("../models/WorkContract")
const { needsToBeWorker, needsToBeAgencyOrBusiness } = require("../utils/middleware")
const { workerExists, workerExistsInContracts } = require("../utils/common")

/**
 * Returns response.body: { The updated Worker object }
 * Route for user to add a feeling.
 * request.body requirements: {value: Int}. That is the minimum, can also be {value: Int, note: "note"}
 * Must be logged in as user.
 */
feelingsRouter.post("/", authenticateToken, needsToBeWorker, async (request, response, next) => {
  try {
    const body = request.body
    if (body.value !== undefined) {
      User.findByIdAndUpdate(
        // User id got from middleware.js. AddToSet adds 'value' and 'note' to feelings array. Note not added if undefined.
        response.locals.decoded.id,
        { $addToSet: { feelings: [{ value: body.value, note: body.note }] } },
        { new: true, omitUndefined: true, runValidators: true },
        (error, result) => {
          if (!result || error) {
            response.status(401).send(error || { message: "Received no result when updating user" })
          } else {
            response.status(200).send({ value: body.value, note: body.note })
          }
        })
    } else {
      response.status(400).send({ error: "Request body must include 'value' field" })
    }

  } catch (exception) {
    next(exception)
  }
})

/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for user to get a list of their feelings.
 * Must be logged in as user.
 */
feelingsRouter.get("/", authenticateToken, needsToBeWorker, async (request, response, next) => {
  try {
    // needsToBeWorker middleware function populates found worker into request.worker
    response.status(200).send(request.worker.feelings)
  } catch (exception) {
    next(exception)
  }
})

/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for agency/business to get a list of a worker's feelings they have a contract with.
 */
feelingsRouter.get("/:workerId", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    const workerId = request.params.workerId
    workerExists(workerId, next, (worker) => {
      if (!worker) {
        return response.status(404).send( { message: "Worker with ID " + workerId + " not found" })
      }
      if (request.agency) {
        // Check if agency has business contract with worker.
        const contractIds = request.agency.businessContracts
        workerExistsInContracts(BusinessContract, contractIds, workerId, next, (contracts) => {
          // In callback
          for (let i = 0; i < contracts.length; i++) {
            if (contracts[i].user && contracts[i].user.equals(workerId)) {
              if (contracts[i].contractMade) {
                // Contract with worker found, so agency is allowed to see worker feelings.
                return response.status(200).send(worker.feelings)
              } else {
                // Contract found, but contractMade is false, so worker hasn't approved it yet.
                return response.status(403).send( { message: "Worker has yet to approve contract." })
              }
            }
          }
          // Contract with worker was not found. Not allowed to see feelings.
          response.status(403).send( { message: "Not allowed to see worker feelings if no contract has been made with them." })
        })

      } else if (request.business) {
        // Check is businesss has a work contract with worker.
        const contractIds = request.business.workContracts
        workerExistsInContracts(WorkContract, contractIds, workerId, next, (contracts) => {
          // In callback
          for (let i = 0; i < contracts.length; i++) {
            if (contracts[i].user && contracts[i].user.equals(workerId)) {
              if (Date.now() > contracts[i].validityPeriod.getTime()) {
                // Contract with worker found, so business is allowed to see worker feelings.
                return response.status(200).send(worker.feelings)
              } else {
                // Contract found, but validityPeriod has passed, so contract is no longer valid.
                return response.status(403).send( { message: "Contract with worker has expired." })
              }
            }
          }
          // Contract with worker was not found. Not allowed to see feelings.
          response.status(403).send( { message: "Not allowed to see worker feelings if no contract has been made with them." })
        })

      } else {
        response.status(401).send( { message: "Not authorized" })
      }
    })
  } catch (exception) {
    next(exception)
  }
})

/**
 * Route for worker to delete one of their own feelings by providing an id of that feeling as a parameter.
 */
feelingsRouter.delete("/:feelingId", authenticateToken, needsToBeWorker, async (request, response, next) => {
  try {
    let found = false
    for (const feeling of request.worker.feelings) {
      if (feeling._id.equals(request.params.feelingId)) {
        found = true
        User.findByIdAndUpdate(
          request.worker.id,
          { $pull: { feelings: { _id: request.params.feelingId } } },
          (error, result) => {
            if (!result || error) {
              return response.status(500).send(error || { message: "Did not receive any result from database" })
            } else {
              return response.status(204).send()
            }
          })
      }
    }
    if (!found) {
      response.status(404).send({ message: `Could not find feeling with id ${request.params.feelingId}` })
    }
  } catch (exception) {
    next(exception)
  }
})

module.exports = feelingsRouter