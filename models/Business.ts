import mongoose, {Schema, Document} from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IBusiness extends Document {
  name: any,
  email: any,
  passwordHash?: any,
  createdAt: any,
  phonenumber: any,
  lisences: any,
  businessContracts: any,
  workContracts: any,
  feelings: any,
  userType: any
}

const businessSchema = new Schema<any>({
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
    type: Date,
    immutable: true,
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
  workContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "wContract",
  }],
  businessContracts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "bContract",
  }],
  userType: {
    type: String,
    default: "Business"
  }
})

businessSchema.plugin(mongoosePaginate)

businessSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  },
})

export default mongoose.model<IBusiness>("Business", businessSchema)