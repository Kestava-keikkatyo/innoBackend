
const feelingsRouter = require("express").Router()
const logger = require("../utils/logger")
const authenticateToken = require("../utils/auhenticateToken")

const User = require("../models/User")
const Agency = require("../models/Agency")
const Business = require("../models/Business")
const { needsToBeWorker, needsToBeAgency, needsToBeBusiness } = require("../utils/middleware")

/**
 * Returns response.body: { The updated Worker object }
 * Route for user to add a feeling.
 * request.body requirements: {value: Int}. That is the minimum, can also be {value: Int, note: "note"}
 * Must be logged in as user
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

feelingsRouter.get("/", authenticateToken, async (request, response, next) => {
  try {

  } catch (exception) {
    next(exception)
  }
})

module.exports = feelingsRouter