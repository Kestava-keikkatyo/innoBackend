import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IBusinessContract} from "../objecttypes/modelTypes"

const businessContractSchema = new Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "agency",
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  madeContracts: {
    businesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "businesses"
    }],
    workers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "workers"
    }]
  },
  requestContracts: {
    businesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "businesses"
    }],
    workers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "workers"
    }]
  }
})

businessContractSchema.plugin(uniqueValidator)

export default mongoose.model<IBusinessContract>("BusinessContract", businessContractSchema)