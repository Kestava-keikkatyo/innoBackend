const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator')

const FormSchema = mongoose.Schema({
  


});

FormSchema.plugin(uniqueValidator)

FormSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
      delete returnedObject.passwordHash
    }
  })

module.exports = mongoose.model("form, FormsSchema");

module.exports = Form