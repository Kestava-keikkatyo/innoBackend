import mongoose, {Schema} from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2';
import {IAdminDocument} from "../objecttypes/modelTypes"

const adminSchema = new Schema({
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
  passwordHash: {
    type: String,
    required: true
  },
notifications: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "Notifications"
}],
/*profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },*/
  createdAt: {
    type: Date,
    immutable: true,
    default: Date.now,
  },
  userType: {
    type: String,
    default: "Admin"
  },
  active: {
    type: Boolean,
    default: true
  }
})

adminSchema.plugin(mongoosePaginate)

adminSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    delete returnedObject.passwordHash
  },
})

export default mongoose.model<IAdminDocument>("Admin", adminSchema)
