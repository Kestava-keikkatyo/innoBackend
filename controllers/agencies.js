const agenciesRouter = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const authenticateToken = require("../utils/auhenticateToken")

const Agency = require("../models/Agency")
const User = require("../models/User")

const domainUrl = "http://www.domain.com/"
const agencyApiPath = "api/agency/"

/**
 * Agency registration.
 * Returns a token that is used for user log in.
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
 * Path for adding a worker to an Agency's list of workers
 * Example "http://www.domain.com/api/1/workers/"
 * where "1" is the id of the Agency in question.
 * Workers are given as a json array of IDs: {"workers": ["id1","id2","id3"...]}
 * A single worker can be given as json: {"worker":"id"}
 */
agenciesRouter.post("/:id/workers", authenticateToken, (request, response, next) => {
  // The first 3 ifs here might be better off at a middleware later on...

  // Check if :id parameter is a legitimate integer
  var agencyId
  try {
    agencyId = parseInt(request.params.id)
  } catch(exception) {
    return response
      .status(400)
      .json({ error: "Could not parse " + request.params.id + " as an Agency ID." })
  }

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
      var workerId
      try {
        workerId = parseInt(request.body.worker)
      } catch (exception) {
        return response
          .status(400)
          .json({ error: "Could not parse " + request.body.worker + " as a Worker ID." })
      }
      // addToSet operation adds an item to a mongoose array, if that item is not already present.
      if (workerExists(workerId)) {
        Agency.findAndUpdateOne({ _id: response.locals.decoded.id }, { $addToSet: { users: [workerId] } }, (error, result) => {
          if (error || !result) {
            return response
              .status(400)
              .json({ error: "Could not add Worker with ID" + workerId + " into Agency with ID" + agencyId + "." })
          } else {
            return response
              .status(200)
              .json({ updated: domainUrl + agencyApiPath + agencyId })
          }
        })
      } else {
        return response
          .status(400)
          .json({ error: "Could not find Worker with ID" + workerId + "." })
      }


      // Adding several workers
    } else if (request.body.workers) {
      const workerIdsToAdd = workersWhoExist(request.body.workers)
      if (workerIdsToAdd) {
        // $addToSet adds to mongoose array if the item does not already exist, thus eliminating duplicates.
        Agency.findAndUpdateOne({ _id: response.locals.decoded.id }, { $addToSet: { users: workerIdsToAdd } }, (error, result) => {
          if (error || !result) {
            console.log("Could not add worker array to Agency. Error: " + error)
            return response
              .status(400)
              .json({ error: "Could not add all Workers to Agency, so added none." })
          }
        })
      }
    }
  } catch (exception) {
    next(exception)
  }
})

/**
 * Checks if a worker with param id exists.
 * @param {*} id
 * @returns True, if worker exists. False, if not.
 */
function workerExists(id) {
  try {
    User.findById({ _id: id }, (error, result) => {
      if (error || !result) {
        return false
      } else {
        return true
      }
    })

  } catch (exception) {
    return false
  }
}

/**
 * Checks through an array of worker ids,and returns an array of ids that exist.
 * Returned list may contain duplicates, if the param array had them.
 * @param {Array} workerIdArray
 */
function workersWhoExist(workerIdArray) {
  try {
    var existingWorkerIds = []
    var idInteger
    if (Array.isArray(workerIdArray)) {
      workerIdArray.forEach( id => {
        try {
          idInteger = parseInt(id)
          User.findById(id, (error, result) => {
            if (result) {
              existingWorkerIds.push(idInteger)
            }
          })
        } catch (exception) {
          // nothing happens, parseInt just failed so the id does not get added to existingWorkerIds.
        }
      })
    }
    return existingWorkerIds
  } catch (exception) {
    return null
  }
}



module.exports = agenciesRouter
