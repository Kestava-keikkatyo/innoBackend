import mongoose, { Schema } from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { IReportDocument } from "../objecttypes/modelTypes"

const reportSchema = new Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
    },
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
    }
})

reportSchema.plugin(uniqueValidator)

export default mongoose.model<IReportDocument>("Report", reportSchema)