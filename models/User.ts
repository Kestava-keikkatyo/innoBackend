import mongoose, {Schema, Document} from "mongoose"
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2'
//https://mongoosejs.com/docs/validation.html
//email validator tarkistettava toimiiko halutulla tavalla, samoin phonenumber validator
export interface IUser extends Document {
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
const userSchema = new Schema<any>({
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
  feelings: [{
    value: {
      type: Number,
      required: true,
      min: [0, "Feelings can't go below 0"],
      max: [3, "Feelings can't be above 3"]
    },
    createdAt: {
      type: Date,
      default: Date.now,
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

userSchema.plugin(mongoosePaginate)

userSchema.set("toJSON", {
  transform: (_document: any, returnedObject: any) => {
    if (returnedObject._id) returnedObject.id = returnedObject._id.toString() // TODO do this in other models as well, and for other fields. if _id field is excluded, it will be undefined and trying to call toString on it will crash
    if (returnedObject.feelings !== undefined) {
      returnedObject.feelings.forEach((feeling: any) => feeling.id = feeling._id)
      returnedObject.feelings.forEach((feeling: any) => delete feeling._id)
    }
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

export default mongoose.model<IUser>('User', userSchema)