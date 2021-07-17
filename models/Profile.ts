import mongoose, {Schema} from "mongoose"
import mongoosePaginate from 'mongoose-paginate-v2'
import { IProfileDocument } from "../objecttypes/modelTypes"

import { error as _error } from "../utils/logger"

const profileSchema = new Schema ({
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  streetAddress:{
      type: String,
      required: false
  },
  zipCode:{
      type: String,
      required: false
  },
  city:{
      type: String,
      required: false
  },
  coverPhoto: {
    type: String,
    required: false
  },
  profilePicture: {
  type: String,
  required: false
  },
  video: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false
  },
  instructions: {
    type: Array,
    required: false
  },
  occupationalSafetyRules:{
    type: Array,
    requeired: false
  }
})

profileSchema.plugin(mongoosePaginate)

export default mongoose.model<IProfileDocument>("Profile", profileSchema)