const agenciesRouter = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const authenticateToken = require("../utils/auhenticateToken")

const Agency = require("../models/Agency")

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

/**
 * Path for adding a worker to an Agency's list of workers
 * Example "http://www.domain.com/api/1/workers/" 
 * where "1" is the id of the Agency in question.
 */
agenciesRouter.post("/:id/workers", authenticateToken, (request, response, next) => {
  try {
    var id = parseInt(request.params.id)
  } catch(exception) {
    return response
      .status(400)
      .json({ error: "Could not parse " + id + " as an Integer ID."})
  }

  var agency
  try {
    Agency.findById({ _id: request.params.id }, (error, result) => {
      //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
      if (!result || error) {
        response.status(401).send(error || { message: "No Agency found with ID " + id })
      } else {
        agency = result
      }
    })

    // Add Worker id from request to this Agency's list of workers

    return response
      .status(400)
      .json({ error: "Not yet implemented." })

  } catch (exception) {
    next(exception)
  }
})

module.exports = agenciesRouter
