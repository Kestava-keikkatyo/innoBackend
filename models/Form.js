const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const formSchema = mongoose.Schema({



})

formSchema.plugin(uniqueValidator)

formSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})


const Form = mongoose.model("Form", formSchema)

module.exports = Form