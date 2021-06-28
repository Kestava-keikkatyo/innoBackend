import mongoose, {Schema} from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2';
import {IBusinessDocument} from "../objecttypes/modelTypes"

const businessSchema = new Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    immutable: true,
    validate: {
      validator: (value: string) => {
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
      },
      message: (props: any) => `${props.value} is not a valid email address`
    }
  },
  city: {
    type: String,
  },
  postnumber: {
    type: String,
  },
  address: {
    type: String,
  },
  phonenumber: {
    type: String,
    validate: {
      validator: (value: string) => {
        // https://regexr.com/3c53v
        return /^[+]*[(]?[0-9]{1,4}[)]?[-\s.\/0-9]*$/g.test(value)
      },
      message: (props: any) => `${props.value} is not a valid phone number`
    }
  },
  securityOfficer: {
    type: String,
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: Date.now,
  },
  forms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
  ],
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile"
  },
  workContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkContract",
  }],
  businessContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusinessContract",
  }],
  userType: {
    type: String,
    default: "Business"
  },
  videoUriId: String,
  instructions: [String],
  workingHours: {
    start: Number,
    end: Number
  },
  contactPreference: String,
  socialMedias: [String]
})

businessSchema.plugin(mongoosePaginate)

businessSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    delete returnedObject.passwordHash
  },
})

export default mongoose.model<IBusinessDocument>("Business", businessSchema)
