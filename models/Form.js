const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const formSchema = mongoose.Schema({
  title: String,
  questions: [{
    questionType: "comment",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 1000
    }
  }, {
    questionType: "text",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 200
    },
    questionSubTitle: {
      type: String,
      minLength: 0,
      maxLength: 500
    },
    optional: Boolean
  }, {
    questionType: "textarea",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 1000
    },
    questionSubTitle: {
      type: String,
      minLength: 0,
      maxLength: 500
    },
    optional: Boolean
  }, {
    questionType: "checkbox",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 200
    },
    questionSubTitle: {
      type: String,
      minLength: 0,
      maxLength: 500
    },
    optional: Boolean
  }, {
    questionType: "checkbox-group",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 200
    },
    options: [{
      name: String,
      value: String
    }],
    questionSubTitle: {
      type: String,
      minLength: 0,
      maxLength: 500
    },
    optional: Boolean
  }, {
    questionType: "radiobutton-group",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 200
    },
    options: [{
      name: String,
      value: String
    }],
    questionSubTitle: {
      type: String,
      minLength: 0,
      maxLength: 500
    },
    optional: Boolean
  }, {
    questionType: "radiobutton-group-horizontal",
    questionTitle: {
      type: String,
      minLength: 0,
      maxLength: 200
    },
    scale: Number,
    scaleOptionTitles: [String],
    questionSubTitle: {
      type: String,
      minLength: 0,
      maxLength: 500
    },
    optional: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
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