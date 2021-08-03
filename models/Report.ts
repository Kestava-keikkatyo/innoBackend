import mongoose, { Schema } from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { IReportDocument } from "../objecttypes/modelTypes"

const reportSchema = new Schema({
    workTitle: {
        type: String,
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
    },
    businessAsHandler: {
        type: String,
        required: false
    },
    agencyAsHandler: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: false
    }
})

reportSchema.plugin(uniqueValidator)

export default mongoose.model<IReportDocument>("Report", reportSchema)