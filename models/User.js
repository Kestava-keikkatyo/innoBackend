const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

//https://mongoosejs.com/docs/validation.html
//email validator tarkistettava toimiiko halutulla tavalla, samoin phonenumber validator
const userSchema = mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  email: {
    type: String,
    unique: true,
    immutable: true,
    validate: {
      validator: value => {
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
      },
      message: props => `${props.value} is not a valid email address`
    },
    required: [true, "User email required"]
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true
  },
  phonenumber: {
    type: String,
    validate: {
      validator: value => {
        // https://regexr.com/3c53v
        return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/g.test(value)
      },
      message: props => `${props.value} is not a valid phone number`
    }
  },
  licenses: [{
    type: String,
    minlength: 3
  }],
  businessContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "bContract",
  }],
  feelings: [{
    value: {
      type: Number,
      required: true,
      min: [0, "Feelings can't go below 0"],
      max: [3, "Feelings can't be above 3"]
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      immutable: true
    },
    note: {
      type: String
    }
  }],
  workContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "wContract",
  }],
  userType: {
    type: String,
    default: "Worker"
  }
})

userSchema.plugin(uniqueValidator)

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.feelings.forEach(feeling => feeling.id = feeling._id)
    returnedObject.feelings.forEach(feeling => delete feeling._id)
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model("User", userSchema)

module.exports = User