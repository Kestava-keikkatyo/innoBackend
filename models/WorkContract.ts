import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IWorkContract} from "../objecttypes/modelTypes"

const subContractSchema = new Schema({
  workers: [{
    type:mongoose.Schema.Types.ObjectId,
    ref:"workers"
  }],
  workerCount: {
    type:String
  },
  acceptedAgency: {
    type:Boolean
  },
  acceptedBusiness: {
    type:Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  validityPeriod: {
    startDate: {
      type:Date
    },
    endDate: {
      type:Date
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

export default mongoose.model<IWorkContract>("WorkContract", workContractSchema)