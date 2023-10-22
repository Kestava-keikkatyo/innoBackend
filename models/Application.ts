import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IApplicationDocument } from "../objecttypes/modelTypes";

const applicationSchema = new Schema({
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    required: false,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  explanation: {
    type: String,
    required: false,
  },
  fileUrl: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

applicationSchema.plugin(mongoosePaginate);

export default mongoose.model<IApplicationDocument>("Application", applicationSchema);
