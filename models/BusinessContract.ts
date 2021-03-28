import mongoose, {Schema, Document} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

export interface IBusinessContract extends Document {
  _id: mongoose.Schema.Types.ObjectId
  contractMade: boolean,
  createdAt: Date,
  validityPeriod: Date,
  user: mongoose.Schema.Types.ObjectId,
  business: mongoose.Schema.Types.ObjectId,
  agency: mongoose.Schema.Types.ObjectId,
  contractType: string
}

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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
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

export default mongoose.model<IBusinessContract>("BusinessContract", businessContractSchema)