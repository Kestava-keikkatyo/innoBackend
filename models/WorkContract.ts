import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IWorkContractDocument} from "../objecttypes/modelTypes"

const subContractSchema = new Schema({
  acceptedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "acceptedWorkers"
  }],
  requestWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:"requestWorkers"
  }],
  workerCount: {
    type: Number
  },
  acceptedAgency: {
    type: Boolean
  },
  acceptedBusiness: {
    type: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  validityPeriod: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  }
})

const workContractSchema = new Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "business"
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "agency"
  },
  contracts: [subContractSchema]
})

workContractSchema.plugin(uniqueValidator)

export default mongoose.model<IWorkContractDocument>("WorkContract", workContractSchema)