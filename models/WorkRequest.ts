import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IWorkRequestDocument } from "../objecttypes/modelTypes";

const workRequestSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  headline: {
    type: String,
    required: true,
  },
  workersNumber: {
    type: Number,
    required: false,
  },
  requirements: {
    type: String,
    required: true,
  },
  desirableSkills: {
    type: String,
    required: false,
  },
  details: {
    type: String,
    required: false,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
    required: false,
  },
  createdAt: {
    immutable: true,
    type: Date,
    default: Date.now,
  },
});

workRequestSchema.plugin(uniqueValidator);

export default mongoose.model<IWorkRequestDocument>(
  "WorkRequest",
  workRequestSchema
);
