const usersRouter = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

usersRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);

    const user = new User({
      username: body.username,
      email: body.email,
      passwordHash,
    });
    // https://mongoosejs.com/docs/api.html#model_Model.exists
    // Same as MyModel.exists({ answer: 42 }) is equivalent to MyModel.findOne({ answer: 42 }).select({ _id: 1 }).lean().then(doc => !!doc)
    const doesUserExist = await User.exists({ username: body.username });
    const doesEmailExist = await User.exists({ email: body.email });

    if (doesUserExist) {
      return response.status(401).json({
        error: "User exists already",
      });
    }

    if (doesEmailExist) {
      return response.status(401).json({
        error: "Email exists already",
      });
    }
    const savedUser = await user.save();

    response.json(savedUser);
  } catch (exception) {
    next(exception);
  }
});

module.exports = usersRouter;
