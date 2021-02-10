
const feelingsRouter = require("express").Router()
const logger = require("../utils/logger")
const authenticateToken = require("../utils/auhenticateToken")

const User = require("../models/User")
const Agency = require("../models/Agency")
const Business = require("../models/Business")
const { needsToBeWorker, needsToBeAgency, needsToBeBusiness } = require("../utils/middleware")

/**
 * Route for user to add a feeling.
 * request.body requirements: {value: Int}. That is the minimum, can also be {value: Int, note: "note"}
 * Must be logged in as user
 */
feelingsRouter.post("/", authenticateToken, needsToBeWorker, async (request, response, next) => {
  const body = request.body
  if (body.value) {

  }

  if (body.note) {

  }

  try {

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