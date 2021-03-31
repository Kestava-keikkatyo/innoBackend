import mongoose, {Schema, Document} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

export interface IWorkContract extends Document {
  business: mongoose.Schema.Types.ObjectId,
  agency: mongoose.Schema.Types.ObjectId
  contracts: Array<Object>
}

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
    type:Date,
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
    type:mongoose.Schema.Types.ObjectId,
    ref:"agency"
  },
  contracts: [subContractSchema]
})

workContractSchema.plugin(uniqueValidator)

export default mongoose.model<IWorkContract>("WorkContract", workContractSchema)