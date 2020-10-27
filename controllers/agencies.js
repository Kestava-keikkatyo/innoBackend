const agenciesRouter = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../utils/auhenticateToken");

const Agency = require("../models/Agency");

/**
 * Agency registration.
 * Returns a token that is used for user log in.
 */
agenciesRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body;
    const passwordLength = body.password ? body.password.length : 0;
    if (passwordLength < 3) {
      return response
        .status(400)
        .json({ error: "password length less than 3 characters" });
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);

    const agencyToCreate = new Agency({
      name: body.name,
      email: body.email,
      passwordHash,
    });
    const agency = await agencyToCreate.save();

    const agencyForToken = {
      email: agency.email,
      id: agency._id,
    };

    const token = jwt.sign(agencyForToken, process.env.SECRET);

    response
      .status(200)
      .send({ token, name: agency.name, email: agency.email, role: "agency" });
  } catch (exception) {
    next(exception);
  }
});

agenciesRouter.get("/me", authenticateToken, (request, response, next) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    const decoded = response.locals.decoded;
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    User.findById({ _id: decoded.id }, function (err, result) {
      if (err) {
        response.send(err);
      } else {
        response.status(200).send(result);
      }
    });
  } catch (exception) {
    next(exception);
  }
});

module.exports = agenciesRouter;
