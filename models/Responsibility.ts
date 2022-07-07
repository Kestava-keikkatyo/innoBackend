import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IResponsibilityDocument } from "../objecttypes/modelTypes";

const responsibilitySchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  responsible: {
    type: String,
    enum: ["worker", "agency", "business"],
    required: true,
  },
  rule: {
    type: String,
    required: true,
  },
  createdAt: {
    immutable: true,
    type: Date,
    default: Date.now,
  },
});

responsibilitySchema.plugin(uniqueValidator);

export default mongoose.model<IResponsibilityDocument>("Responsibility", responsibilitySchema);
