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
    min: [0, "Comfortable can't go below 0"],
    max: [4, "Comfortable can't be above 4"],
  },
  satisfied: {
    type: Number,
    required: false,
    min: [0, "Satisfied can't go below 0"],
    max: [4, "Satisfied can't be above 4"],
  },
  energetic: {
    type: Number,
    required: false,
    min: [0, "Energetic can't go below 0"],
    max: [4, "Energetic can't be above 4"],
  },
  enthusiastic: {
    type: Number,
    required: false,
    min: [0, "Enthusiastic can't go below 0"],
    max: [4, "Enthusiastic can't be above 4"],
  },
  frustrated: {
    type: Number,
    required: false,
    min: [0, "Frustrated can't go below 0"],
    max: [4, "Frustrated can't be above 4"],
  },
  stressed: {
    type: Number,
    required: false,
    min: [0, "Stressed can't go below 0"],
    max: [4, "Stressed can't be above 4"],
  },
  anxious: {
    type: Number,
    required: false,
    min: [0, "Anxious can't go below 0"],
    max: [4, "Anxious can't be above 4"],
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
