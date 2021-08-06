import mongoose, { Schema } from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { IReportDocument } from "../objecttypes/modelTypes"

const reportSchema = new Schema({
    workTitle: {
        type: String,
        required: true
    },
    reportTitle: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
    },
    workerName: {
        type: String,
        required: false
    },
    workerEmail: {
        type: String,
        required: false
    },
    workerPhone: {
        type: String,
        required: false
    },
    businessAsHandler: {
        type: String,
        required: false
    },
    agencyAsHandler: {
        type: String,
        required: false
    },
    fileUrl: {
        type: String,
        required: false
    },
    fileType: {
        type: String,
        required: false
    }
})

reportSchema.plugin(uniqueValidator)

export default mongoose.model<IReportDocument>("Report", reportSchema)