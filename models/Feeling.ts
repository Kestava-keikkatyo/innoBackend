import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IFeelingDocument } from "../objecttypes/modelTypes";

const feelingSchema: Schema = new Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true,
  },
  comfortable: {
    type: Number,
    required: false,
    min: [1, "Comfortable can't go below 1"],
    max: [5, "Comfortable can't be above 5"],
  },
  satisfied: {
    type: Number,
    required: false,
    min: [1, "Satisfied can't go below 1"],
    max: [5, "Satisfied can't be above 5"],
  },
  energetic: {
    type: Number,
    required: false,
    min: [1, "Energetic can't go below 1"],
    max: [5, "Energetic can't be above 5"],
  },
  enthusiastic: {
    type: Number,
    required: false,
    min: [1, "Enthusiastic can't go below 1"],
    max: [5, "Enthusiastic can't be above 5"],
  },
  frustrated: {
    type: Number,
    required: false,
    min: [1, "Frustrated can't go below 1"],
    max: [5, "Frustrated can't be above 5"],
  },
  stressed: {
    type: Number,
    required: false,
    min: [1, "Stressed can't go below 1"],
    max: [5, "Stressed can't be above 5"],
  },
  anxious: {
    type: Number,
    required: false,
    min: [1, "Anxious can't go below 1"],
    max: [5, "Anxious can't be above 5"],
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
