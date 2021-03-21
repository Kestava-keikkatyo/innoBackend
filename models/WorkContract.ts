import mongoose, {Schema, Document} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

export interface IWorkContract extends Document {
  createdAt: Date,
  validityPeriod: Date,
  user: mongoose.Schema.Types.ObjectId,
  business: mongoose.Schema.Types.ObjectId,
  agency: mongoose.Schema.Types.ObjectId
}

const workContractSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  validityPeriod: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "business"
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "agency"
  }
})


workContractSchema.plugin(uniqueValidator)

workContractSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

export default mongoose.model<IWorkContract>("WorkContract", workContractSchema)