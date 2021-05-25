import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IBusinessContractDocument} from "../objecttypes/modelTypes"

const businessContractSchema = new Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
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
      ref: "Business"
    }],
    workers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker"
    }]
  },
  requestContracts: {
    businesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business"
    }],
    workers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker"
    }]  
  },
  pendingContracts: {
    businesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business"
    }],
    workers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker"
    }]
  }
})

businessContractSchema.plugin(uniqueValidator)

export default mongoose.model<IBusinessContractDocument>("BusinessContract", businessContractSchema)