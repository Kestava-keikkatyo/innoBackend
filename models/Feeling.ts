import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IFeelingDocument } from "../objecttypes/modelTypes";

const feelingSchema: Schema = new Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  feeling: {
    type: Number,
    required: false,
    min: [1, "Satisfied can't go below 1"],
    max: [5, "Satisfied can't be above 5"],
  },
  comment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

feelingSchema.plugin(uniqueValidator);

export default mongoose.model<IFeelingDocument>("Feeling", feelingSchema);
