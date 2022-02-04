import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IApplicationDocument } from "../objecttypes/modelTypes";
import { error as _error } from "../utils/logger";

const applicationSchema = new Schema({
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

applicationSchema.plugin(mongoosePaginate);

export default mongoose.model<IApplicationDocument>(
  "Application",
  applicationSchema
);
