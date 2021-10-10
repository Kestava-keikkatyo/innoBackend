import mongoose, { Schema } from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2'
import { IAgencyDocument } from "../objecttypes/modelTypes"
//https://mongoosejs.com/docs/validation.html
//email validator tarkistettava toimiiko halutulla tavalla

const agencySchema = new Schema({
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
  category: {
    type: String,
    ref: "Category"
  },
  securityOfficer: {
    type: String,
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    immutable: true,
    type: Date,
    default: Date.now,
  },
  forms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
  ],
  businessContractForms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
  ],
  jobVacancies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobVacancy",
    },
  ],
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile"
  },
  businessContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusinessContract",
  },
  ],
  workContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "wContract",
  },
  ],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notifications"
  }],
  feedBack: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeedBack"
  }],
  userType: {
    type: String,
    default: "Agency"
  },
  active: {
    type: Boolean,
    default: true
  }
})

agencySchema.plugin(mongoosePaginate)

agencySchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    delete returnedObject.passwordHash
  },
})

export default mongoose.model<IAgencyDocument>("Agency", agencySchema)
