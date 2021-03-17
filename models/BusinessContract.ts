import mongoose, {Schema, Document} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

export interface IBusinessContract extends Document {
  createdAt: any,
  validityPeriod: Date,
  user: any,
  business: any,
  agency: any
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

businessContractSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

export default mongoose.model<IBusinessContract>("BusinessContract", businessContractSchema)