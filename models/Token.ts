import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { ITokenDocument } from "../objecttypes/modelTypes";

const tokenSchema: Schema = new Schema({
  token: {
    type: String,
    required: true,
  },
  lastUsedAt: {
    immutable: true,
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
});

tokenSchema.plugin(uniqueValidator);

export default mongoose.model<ITokenDocument>("Token", tokenSchema);
