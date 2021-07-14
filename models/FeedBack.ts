import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import { IFeedBackDocument } from "../objecttypes/modelTypes"

const feedBackSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker Business Agency"
  },
  heading: {
    type: String,
    ref: "FeedbackHeading"
  },
  message: {
    type: String,
    ref: "FeedbackMessage"
  },
  reply: {
    type: String,
    ref: "FeedbackReply"
  }
})

feedBackSchema.plugin(uniqueValidator)

export default mongoose.model<IFeedBackDocument>("FeedBack", feedBackSchema)