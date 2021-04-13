import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IBusinessContractDocument} from "../objecttypes/modelTypes"

const businessContractSchema = new Schema({
  contractMade: {
    default: false,
    type: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "business",
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "worker"
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "agency"
  },
  contractType: {
    type: String,
    ref: "ContractType"
  }
})


businessContractSchema.plugin(uniqueValidator)

export default mongoose.model<IBusinessContractDocument>("BusinessContract", businessContractSchema)