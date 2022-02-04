import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IFeedbackDocument } from "../objecttypes/modelTypes";

const feedbackSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  heading: {
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
});

feedbackSchema.plugin(uniqueValidator);

export default mongoose.model<IFeedbackDocument>("Feedback", feedbackSchema);
