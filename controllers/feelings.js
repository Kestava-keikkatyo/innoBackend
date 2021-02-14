
const feelingsRouter = require("express").Router()
const logger = require("../utils/logger")
const authenticateToken = require("../utils/auhenticateToken")

const User = require("../models/User")
const Agency = require("../models/Agency")
const Business = require("../models/Business")
const { needsToBeWorker, needsToBeAgencyOrBusiness } = require("../utils/middleware")
const { workerExists } = require("../utils/common")

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
            return response.status(401).send(error || { message: "Not authorized" })
          } else {
            return response.status(200).send(result)
          }
        })
    } else {
      return response.status(400).send({ error: "Request body must include 'value' field" })
    }

  } catch (exception) {
    next(exception)
  }
})

/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for user to get a list of their feelings. Could just use /users/me path, but this is less heavy.
 * Must be logged in as user.
 */
feelingsRouter.get("/", authenticateToken, needsToBeWorker, async (request, response, next) => {
  try {
    // needsToBeWorker middleware function populates found worker into request.worker
    return response.status(200).send(request.worker.feelings)
  } catch (exception) {
    next(exception)
  }
})

/**
 *
 */
feelingsRouter.get("/:workerId", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    const workerId = request.params.workerId
    const worker = workerExists(workerId)
    if (!worker) {
      response.status(404).send( { message: "Worker with ID " + workerId + " not found" })
    } else {
      if (request.agency) {
        // Check if agency has business contract with worker. (Business vai work contract???)
      } else if (request.business) {
        // Check is businesss has a work contract with worker. (Business vai work contract???)
      }
    }
  } catch (exception) {
    next(exception)
  }
})

module.exports = feelingsRouter