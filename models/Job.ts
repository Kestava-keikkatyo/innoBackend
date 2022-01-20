import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { IJobDocument } from "../objecttypes/modelTypes";

//This model is used for adding job advertisement/announcement by Agency to inform workers that a certain job position is available
const jobSchema = new Schema({
  agency: {
    // This is used to get supplier's contact information
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    immutable: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  jobType: {
    // Tis uesed to tell the applicant or candidate about employment type like full- or part-time
    type: String,
  },
  location: {
    // This is used to tell the applicant or candidate about job location
    street: String,
    zipCode: String,
    city: String,
  },
  salary: {
    type: Number,
  },
  requirements: {
    type: String,
    required: true,
  },
  desirableSkills: {
    type: String,
  },
  benefits: {
    // This is used to tell worker about supportive care
    type: String,
  },
  details: {
    type: String,
    required: true,
  },
  duration: {
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      required: false,
    },
    applicationLastDate: {
      type: Date,
    },
  },
  createdAt: {
    // This is used for job release date
    immutable: true,
    type: Date,
    default: Date.now,
  },
});

jobSchema.plugin(uniqueValidator);

export default mongoose.model<IJobDocument>("Job", jobSchema);
