import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IAgreementDocument } from "../objecttypes/modelTypes";

const agreementSchema : Schema = new Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Creator",
    immutable: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Target",
    immutable: true,
  },
  form2: {
    type: Array,
    ref: "Form2",
  },
  type: {
    type: String,
    enum: ["request", "contract"],
    default: "contract",
    required: true,
  },
  status: {
    type: String,
    enum: ["signed", "rejected", "pending", "request"],
    default: "pending",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  signed: {
    type: Date,
    default: null,
  },
});

agreementSchema.plugin(uniqueValidator);

export default mongoose.model<IAgreementDocument>("Agreement", agreementSchema);
