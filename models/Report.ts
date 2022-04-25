import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IReportDocument } from "../objecttypes/modelTypes";

const reportSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  status: {
    type: String,
    enum: ["pending", "replied"],
    default: "pending",
    required: false,
  },
  businessReply: {
    type: String,
    required: false,
  },
  agencyReply: {
    type: String,
    required: false,
  },
  fileUrl: {
    type: String,
    required: false,
  },
  fileType: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.plugin(uniqueValidator);

export default mongoose.model<IReportDocument>("Report", reportSchema);
