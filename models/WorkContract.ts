import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IWorkContract} from "../objecttypes/modelTypes"

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

export default mongoose.model<IWorkContract>("WorkContract", workContractSchema)