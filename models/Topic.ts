import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { ITopicDocument } from "../objecttypes/modelTypes";

const faqSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  createdAt: {
    immutable: true,
    type: Date,
    default: Date.now,
  },
});

faqSchema.plugin(uniqueValidator);

export default mongoose.model<ITopicDocument>("Topic", faqSchema);
