import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { INotificationsDocument } from "../objecttypes/modelTypes"

const notificationsSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker Business Agency"
    },
    unread_messages: [{
        text: {
            type: String,
            ref: "Message"
        }
    }],
    read_messages: [{
        text: {
            type: String,
            ref: "Message"
        }
    }],
    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now,
    },
}) 

notificationsSchema.plugin(uniqueValidator)

export default mongoose.model<INotificationsDocument>("Notifications", notificationsSchema)