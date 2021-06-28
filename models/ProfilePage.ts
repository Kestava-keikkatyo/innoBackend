import mongoose, {Schema} from "mongoose"
import mongoosePaginate from 'mongoose-paginate-v2'
import { IProfilePageDocument } from "../objecttypes/modelTypes"

import { error as _error } from "../utils/logger"

const profileSchema = new Schema ({
  user: {
    type: mongoose.Schema.Types.ObjectId,
  },
  cover: {
    type: Object,
    required: false
  },
  profilePicture: {
    type: Object,
    required: false
  },
  userInformation: {
    type: String,
    required: false
  },
  contactInformation: {
    type: String,
    required: false
  },
  video: {
    type: String,
    required: false
  },
  instructions: {
  type: String,
  required: false
}
})

profileSchema.plugin(mongoosePaginate)

export default mongoose.model<IProfilePageDocument>("ProfilePage", profileSchema)