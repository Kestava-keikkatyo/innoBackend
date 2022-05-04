import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { INotificationsDocument } from "../objecttypes/modelTypes"

const notificationsSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: null
    },
    is_read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now,
    },
})

notificationsSchema.plugin(uniqueValidator)

export default mongoose.model<INotificationsDocument>("Notifications", notificationsSchema)