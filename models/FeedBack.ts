import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IFeedbackDocument } from "../objecttypes/modelTypes";

const feedbackSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      immutable: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shift: {
      type: Number,
      required: true,
      min: [1, "shift can't go below 1"],
      max: [4, "shift can't be above 4"],
    },
    shiftMessage: {
      type: String,
    },
    orientation: {
      type: Number,
      required: true,
      min: [1, "orientation can't go below 1"],
      max: [4, "orientation can't be above 4"],
    },
    orientationMessage: {
      type: String,
    },
    reception: {
      type: Number,
      required: true,
      min: [1, "reception can't go below 1"],
      max: [4, "reception can't be above 4"],
    },
    receptionMessage: {
      type: String,
    },
    appreciation: {
      type: Number,
      required: true,
      min: [1, "appreciation can't go below 1"],
      max: [4, "appreciation can't be above 4"],
    },
    appreciationMessage: {
      type: String,
    },
    expectation: {
      type: Number,
      required: true,
      min: [1, "expectation can't go below 1"],
      max: [4, "expectation can't be above 4"],
    },
    expectationMessage: {
      type: String,
    },
    additionalMessage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

feedbackSchema.plugin(uniqueValidator);

export default mongoose.model<IFeedbackDocument>("Feedback", feedbackSchema);
