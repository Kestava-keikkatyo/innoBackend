const agenciesRouter = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const authenticateToken = require("../utils/auhenticateToken")
const utils = require("../utils/common")
const Agency = require("../models/Agency")

const domainUrl = "http://localhost:3000/"
const agencyApiPath = "api/agencies/"

/**
 * Agency registration.
 * Returns a token that is used for user log in.
 * Request requirements:
 * Body.email, Body.name, Body.password
 */
agenciesRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body
    const passwordLength = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return response
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

    response
      .status(200)
      .send({ token, name: agency.name, email: agency.email, role: "agency" })
  } catch (exception) {
    next(exception)
  }
})

agenciesRouter.get("/me", authenticateToken, (request, response, next) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    const decoded = response.locals.decoded
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    Agency.findById({ _id: decoded.id }, (error, result) => {
      //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
      if (!result || error) {
        response.status(401).send(error || { message: "Not authorized" })
      } else {
        response.status(200).send(result)
      }
    })
  } catch (exception) {
    next(exception)
  }
})

agenciesRouter.put("/", authenticateToken, (request, response, next) => {
  try {
    const decoded = response.locals.decoded

    Agency.updateOne({ _id: decoded.id }, { $set: request.body }, (error) => {
      if (error) {
        response
          .status(400)
          .json({ error: "Agency not found" })
      }
      response
        .status(200)
        .json({ message: "Agency updated" })
    })

  } catch (exception) {
    next(exception)
  }
})

/**
 * Path for adding workers to an Agency's list of workers
 * Example "http://www.domain.com/api/1/workers/"
 * where "1" is the id of the Agency in question.
 * Request requirements: Body.workers / Body.worker
 * Workers are given as a json array of IDs: {"workers": ["id1","id2","id3"...]}
 * A single worker can also be given as json: {"worker":"id"}
 */
agenciesRouter.post("/:id/workers", authenticateToken, (request, response, next) => {
  // The first 3 ifs here might be better off at a middleware later on...

  // Check if :id parameter is a legitimate integer
  let agencyId = request.params.id

  // Check if there is an Agency with :id
  Agency.findById({ _id: agencyId }, (error, result) => {
    if (!result || error) {
      response.status(401).send(error || { message: "No Agency found with ID " + agencyId + "." })
    }
  })

  // Check if the user has a token with the same id as this Agency.
  try {
    // Get decoded token from middleware
    if (response.locals.decoded.id !== agencyId) {
      response.status(401).send({ message: "Not authorized to POST to Agency with ID " + agencyId + "." })
    }

    // Adding a single worker
    if (request.body.worker) {
      let workerId = request.body.worker
      // addToSet operation adds an item to a mongoose array, if that item is not already present.
      if (utils.workerExists(workerId, next)) {
        Agency.findOneAndUpdate({ _id: response.locals.decoded.id }, { $addToSet: { users: [workerId] } }, (error, result) => {
          if (error || !result) {
            return response
              .status(400)
              .json({ error: "Could not add Worker with ID" + workerId + " into Agency with ID" + agencyId + "." })
          } else {
            // Added Worker to Agency, return resource URL
            return response
              .status(200)
              .json({ updated: domainUrl + agencyApiPath + agencyId, workersAdded: workerId })
          }
        })
      } else {
        return response
          .status(400)
          .json({ error: "Could not find Worker with ID " + workerId + "." })
      }

      // Adding several workers
    } else if (request.body.workers) {
      let workerIdsToAdd
      let workerIdsNotOk

      utils.whichWorkersExist(request.body.workers, next, (workerResult) => {
        workerIdsToAdd = workerResult.existingWorkerIds
        workerIdsNotOk = workerResult.nonExistingWorkerIds

        if (workerIdsToAdd && workerIdsToAdd.length > 0) {
          // $addToSet adds to mongoose array if the item does not already exist, thus eliminating duplicates.
          Agency.findOneAndUpdate({ _id: response.locals.decoded.id }, { $addToSet: { users: workerIdsToAdd } }, (error, result) => {
            if (error || !result) {
              console.log("Could not add worker array to Agency. Error: " + error)
              return response
                .status(400)
                .json({ error: "Could not add all Workers to Agency, so added none." })
            }
            // There were some ok worker ids to add
            return response
              .status(200)
              .json({ updated: domainUrl + agencyApiPath + agencyId, workersAdded: workerIdsToAdd, workersNotAdded: workerIdsNotOk })
          })
        } else {
          return response
            .status(400)
            .json({ error: "All of the sent Worker Ids were either erronous or could not be matched with an existing worker." })
        }
      } )
    }
  } catch (exception) {
    next(exception)
  }
})

module.exports = agenciesRouter
