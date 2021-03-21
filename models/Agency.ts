import mongoose, {Schema, Document} from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2'
//https://mongoosejs.com/docs/validation.html
//email validator tarkistettava toimiiko halutulla tavalla

export interface IAgency extends Document {
  //tähän tyypitys
  name: String,
  email: String,
  passwordHash?: String,
  createdAt: Date,
  phonenumber: String,
  businessContracts: Array<mongoose.Schema.Types.ObjectId>,
  workContracts: Array<mongoose.Schema.Types.ObjectId>,
  feelings: any,
  userType: String
}

const agencySchema = new Schema<any>({
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
      validator: (value: any) => {
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
      validator: (value: any) => {
        // https://regexr.com/3c53v
        return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/g.test(value)
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
    immutable: true,
    type: Date,
    default: Date.now,
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
  userType: {
    type: String,
    default: "Agency"
  }
})

agencySchema.plugin(mongoosePaginate)

agencySchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  },
})

export default mongoose.model<IAgency>("Agency", agencySchema)
