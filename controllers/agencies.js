const agencyRouter = require("express").Router();
const bcrypt = require("bcryptjs");
const Agency = require("../models/Agency");


agencyRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);

    const agency = new Agency({
      name: body.name,
      username: body.username,
      email: body.email,
      city: body.city,
      postnumber: body.postnumber,
      address: body.address,
      phonenumber: body.phonenumber,
      passwordHash,
    });
    // https://mongoosejs.com/docs/api.html#model_Model.exists
    // Same as MyModel.exists({ answer: 42 }) is equivalent to MyModel.findOne({ answer: 42 }).select({ _id: 1 }).lean().then(doc => !!doc)
    const doesAgencyExist = await Agency.exists({ name: body.name });
    const doesEmailExist = await Agency.exists({ email: body.email });

    if (doesAgencyExist) {
      return response.status(401).json({
        error: "Agency exists already",
      });
    }

    if (doesEmailExist) {
      return response.status(401).json({
        error: "Email exists already",
      });
    }
    const savedAgency = await agency.save();

    response.json(savedAgency);
  } catch (exception) {
    next(exception);
  }
});

module.exports = agencyRouter;
