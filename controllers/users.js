const usersRouter = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../utils/auhenticateToken");

const User = require("../models/User");
const { request, response } = require("express");

/**
 * User registration.
 * Returns a token that is used for user log in.
 */
usersRouter.post("/", async (request, response, next) => {
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
    const userToCreate = new User({
      name: body.name,
      email: body.email,
      passwordHash,
    });
    const user = await userToCreate.save();

    const userForToken = {
      email: user.email,
      id: userToCreate._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    response
      .status(200)
      .send({ token, name: user.name, email: user.email, role: "worker" });
  } catch (exception) {
    next(exception);
  }
});

usersRouter.get("/me", authenticateToken, (request, response, next) => {
  try {
    //Decodatun tokenin arvo haetaan middlewarelta
    const decoded = response.locals.decoded;
    //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
    User.findById({ _id: decoded.id }, (error, result) => {
      if (error) {
        response.send(error);
      } else {
        response.status(200).send(result);
      }
    });
  } catch (exception) {
    next(exception);
  }
});

usersRouter.post("/edit", authenticateToken, (request, response, next) => {
  try {
    const decoded = response.locals.decoded;
    console.log(decoded.id);
    User.findById({ _id: decoded.id }, (error, user) => {
      console.log(user);

      if (error) {
        response.send(error);
      }
      if (!user) {
        return response.send("User not found.");
      }

      var name = request.body.name
      var email = request.body.email
      
      if (!name|| !email) {
        return response.send("Name or email missing.");
      }

      user.name = name.trim();
      user.email = email.trim();

      user.save((error) =>{
        if (error) {
          response.send(error);
        }
        response
        .status(200)
        .send("Profile updated");
      });
    });
  } catch (exception) {
    next(exception);
  }
});
module.exports = usersRouter;
