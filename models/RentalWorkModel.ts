import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IRentalWorkModelDocument } from "../objecttypes/modelTypes";

const rentalWorkModelSchema: Schema = new Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      immutable: true,
    },
    customerContract: {
      responsibilities: {
        type: Boolean,
        required: true,
        default: false,
      },
      forms: {
        type: Boolean,
        required: true,
        default: false,
      },
      good_practices: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    orderingEmployee: {
      responsibilities: {
        type: Boolean,
        required: true,
        default: false,
      },
      forms: {
        type: Boolean,
        required: true,
        default: false,
      },
      good_practices: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    contractOfEmployment: {
      responsibilities: {
        type: Boolean,
        required: true,
        default: false,
      },
      forms: {
        type: Boolean,
        required: true,
        default: false,
      },
      good_practices: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    guidanceToWork: {
      responsibilities: {
        type: Boolean,
        required: true,
        default: false,
      },
      forms: {
        type: Boolean,
        required: true,
        default: false,
      },
      good_practices: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    workPerformance: {
      responsibilities: {
        type: Boolean,
        required: true,
        default: false,
      },
      forms: {
        type: Boolean,
        required: true,
        default: false,
      },
      good_practices: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    feedbackEvaluation: {
      responsibilities: {
        type: Boolean,
        required: true,
        default: false,
      },
      forms: {
        type: Boolean,
        required: true,
        default: false,
      },
      good_practices: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
  },
  { timestamps: true }
);

rentalWorkModelSchema.plugin(uniqueValidator);

export default mongoose.model<IRentalWorkModelDocument>("RentalWorkModel", rentalWorkModelSchema);
