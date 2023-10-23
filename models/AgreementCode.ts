import mongoose, { Schema } from "mongoose";
import { IAgreementCode } from "../objecttypes/modelTypes";

const agreementCodeSchema: Schema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  marked: {
    type: Boolean,
    default: false,
    required: true,
  },
});

export default mongoose.model<IAgreementCode>("AgreementCode", agreementCodeSchema);
