import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IFeedbackDocument } from "../objecttypes/modelTypes";

const feedbackSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    ref: "FeedbackHeading",
  },
  message: {
    type: String,
    ref: "FeedbackMessage",
  },
  reply: {
    type: String,
    ref: "FeedbackReply",
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: Date.now,
  },
  value: {
    type: String,
    ref: "Value"
  },
  anon: {
    type: Boolean,
    ref: "Anon",
    default: false,
  }
});

feedbackSchema.plugin(uniqueValidator);

export default mongoose.model<IFeedbackDocument>("Feedback", feedbackSchema);
