const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const businessContractSchema = mongoose.Schema({
  contractMade: {
    default: false,
    type: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "business",
  }
})


businessContractSchema.plugin(uniqueValidator)

businessContractSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

const BusinessContract = mongoose.model("BusinessContract", businessContractSchema)

module.exports = BusinessContract