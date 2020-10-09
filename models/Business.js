const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const businessSchema = mongoose.Schema({
  name: {
    type: String,
    required: "Name can't be empty."
  },
  username: {
    type: String,
    required: "Username can't be empty."
  },
  email: {
    type: String,
    required: "Email can't be empty."
  },
  city: {
    type: String,
    required: "City can't be empty."
  },
  postnumber: {
    type: String,
    required: "Postnumber can't be empty."
  },
  address: {
    type: String,
    required: "Address can't be empty."
  },
  phonenumber: {
    type: String,
    required:"Phonenumber can't be empty."
  },
  passwordHash: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  forms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
  ],
});

businessSchema.plugin(uniqueValidator);

businessSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const Business = mongoose.model('Business', businessSchema)

module.exports = Business
