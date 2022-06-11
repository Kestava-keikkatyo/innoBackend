import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IFeedbackDocument } from "../objecttypes/modelTypes";

const feedbackSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  heading: {
    type: String,
    required: false,
  },
  message: {
    type: String,
    required: false,
  },
  reply: {
    type: String,
    required: false,
  },
  replied: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: Date.now,
  },
});

feedbackSchema.plugin(uniqueValidator);

export default mongoose.model<IFeedbackDocument>("Feedback", feedbackSchema);
