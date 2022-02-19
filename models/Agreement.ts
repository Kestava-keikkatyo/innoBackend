import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IAgreementDocument } from "../objecttypes/modelTypes";

const agreementSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  form2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Form2",
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
  },
});

agreementSchema.plugin(uniqueValidator);

export default mongoose.model<IAgreementDocument>("Agreement", agreementSchema);
