import mongoose, {Schema} from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2'
import {IUser} from "../objecttypes/modelTypes"
//https://mongoosejs.com/docs/validation.html
// todo email validator tarkistettava toimiiko halutulla tavalla, samoin phonenumber validator

const userSchema = new Schema({
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
      validator: (value: any) => {
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
      },
      message: (props: any) => `${props.value} is not a valid email address`
    },
    required: [true, "User email required"]
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  phonenumber: {
    type: String,
    validate: {
      validator: (value: any) => {
        // https://regexr.com/3c53v
        return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/g.test(value)
      },
      message: (props: any) => `${props.value} is not a valid phone number`
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
  workContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "wContract",
  }],
  feelings: [{
    value: {
      type: Number,
      required: true,
      min: [0, "Feelings can't go below 0"],
      max: [3, "Feelings can't be above 3"]
    },
    note: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  }],
  userType: {
    type: String,
    default: "Worker"
  }
})

userSchema.plugin(mongoosePaginate)

userSchema.set("toJSON", {
  transform: (_document: any, returnedObject: any) => {
    delete returnedObject.passwordHash
  }
})

export default mongoose.model<IUser>('User', userSchema)