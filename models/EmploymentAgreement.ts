import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IAgreementDocument } from "../objecttypes/modelTypes";

const employmentAgreementSchema: Schema = new Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Creator",
    immutable: true,
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    immutable: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    immutable: true,
  },
  workerSigned: {
    type: Date,
    default: null,
  },
  businessSigned: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["signed", "rejected", "pending"],
    default: "pending",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

employmentAgreementSchema.plugin(uniqueValidator);

export default mongoose.model<IAgreementDocument>("EmploymentAgreement", employmentAgreementSchema);
