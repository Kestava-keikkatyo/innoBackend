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
import express from "express"
import { hash } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { info, error as _error } from "../utils/logger"
import authenticateToken from "../utils/auhenticateToken"

import Worker from "../models/Worker"
import Agency from "../models/Agency"
import BusinessContract from "../models/BusinessContract"
import { needsToBeWorker } from "../utils/middleware"


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
workersRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body
    const passwordLength = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res
        .status(400)
        .json({ error: "Password length less than 3 characters" })
    }
    const saltRounds = 10
    const passwordHash = await hash(body.password, saltRounds)
    const workerToCreate: any = new Worker({ // TODO change any to IWorker after it has been finished
      name: body.name,
      email: body.email,
      passwordHash,
    })
    const worker = await workerToCreate.save() //TODO use callback and check for errors

    const workerForToken = {
      email: worker.email,
      id: workerToCreate._id,
    }

    const token = sign(workerForToken, process.env.SECRET || '')

    res
      .status(200)
      .send({ token, name: worker.name, email: worker.email, role: "worker" })
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
workersRouter.get("/me", authenticateToken, async (_req, res, next) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    const decoded = res.locals.decoded
    //Tokeni pitää sisällään workerid jolla etsitään oikean käyttäjän tiedot
    Worker.findById({ _id: decoded.id }, (error: any, result: any) => {
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
workersRouter.put("/", authenticateToken, async (req, res, next) => {
  const body = req.body
  const decoded = res.locals.decoded
  let passwordHash

  try {
    // Salataan uusi salasana
    if (req.body.password) {
      const passwordLength = body.password ? body.password.length : 0
      if (passwordLength < 3) {
        return res
          .status(400)
          .json({ error: "password length less than 3 characters" })
      }
      const saltRounds = 10
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
    const updatedWorker = await Worker.findByIdAndUpdate(decoded.id, updateFields,
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
workersRouter.get("/", authenticateToken, async (req, res, next) => {
  const decoded = res.locals.decoded
  const name = req.query.name

  try {
    const agency = await Agency.findById(decoded.id)
    if (agency && name) {
      // Työntekijät haetaan SQL:n LIKE operaattorin tapaisesti
      // Työpassit jätetään hausta pois
      const findName: any = { $regex: name, $options: "i" }
      const workers = await Worker.find({ name: findName }, { licenses: 0 })
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
workersRouter.get("/businesscontracts", authenticateToken, needsToBeWorker, async (req, res, next) => {
  const { body } = req
  const contractIds = body.worker.businessContracts
  let contracts: any = []
  let temp: any;
  try {
    if (contractIds) {
      info("Searching database for BusinessContracts: " + contractIds)
      // Go through every contractId and, find contract data and push it to array "contracts".
      contractIds.forEach(async (contractId: string, index: number, contractIds: string[]) => {
        temp = await BusinessContract.findById(contractId).exec()
        if (temp) {
          contracts.push(temp)
          temp = null
        }

        if (index === contractIds.length-1) { // If this was the last contract to find, send res
          info("BusinessContracts to Response: " + contracts)
          res
            .status(200)
            .json(contracts)
        }
      })
    } else { // No contractIds in Worker, respond with empty array
      return res
        .status(200)
        .json(contracts)
    }
  } catch (exception) {
    _error(exception)
    return next(exception)
  }
})

export default workersRouter