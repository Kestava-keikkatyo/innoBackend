import mongoose, { Schema } from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { IJobVacancyDocument } from "../objecttypes/modelTypes"

const jobVacancySchema = new Schema({
    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agency",
        immutable: true
    },
    relatedSubContractOfWorkContract: {
        // There is no reference/model for subcontracts of a work
        // contract, for more info check WorkContract model.
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    jobTitle: {
        type: String,
        required: true

    },
    jobCategory: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true

    },
    requirements: {
        type: Array,
        required: false

    },
    numberOfNeededWorkers: {
        type: Number,
        required: true

    },
    startingDate: {
        type: Date,
        required: true
    },
    endingDate: {
        type: Date,
        required: true
    },
    applyingEndsAt: {
        type: Date,
        required: true
    },
    streetAddress: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    createdAt: { // can be used as a publishing date
        immutable: true,
        type: Date,
        default: Date.now,
    }
})

jobVacancySchema.plugin(uniqueValidator)
export default mongoose.model<IJobVacancyDocument>("JobVacancy", jobVacancySchema)