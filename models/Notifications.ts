import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { INotificationsDocument } from "../objecttypes/modelTypes"

const notificationsSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker Business Agency Admin"
    },
    unread_messages: [{
        notificationId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "NotificationId"
        },
        referenceId: {
            type: String,
            ref: "ReferenceId",
        },
        type: {
            type: String,
            ref: "Type",
        },
        text: {
            type: String,
            ref: "Message",
        },
        createdAt: {
            type: Date,
            immutable: true,
            default: Date.now,
        }
    }],
    read_messages: [{
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ReferenceId",
        },
        type: {
            type: String,
            ref: "Type",
        },
        text: {
            type: String,
            ref: "Message",
        },
        createdAt: {
            type: Date,
            immutable: true,
            default: Date.now,
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