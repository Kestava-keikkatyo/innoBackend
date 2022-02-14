import mongoosePaginate from "mongoose-paginate-v2";
import { IUserDocument } from "../objecttypes/modelTypes";
import mongoose, { Schema } from "mongoose";

const userSchema: Schema = new Schema({
  name: {
    type: String,
    minlength: 3,
    required: false,
  },
  firstName: {
    type: String,
    minlength: 3,
    required: false,
  },
  lastName: {
    type: String,
    minlength: 3,
    required: false,
  },
  userType: {
    type: String,
    enum: ["worker", "admin", "agency", "business"],
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "User email required"],
    immutable: true,
    validate: {
      validator: (value: string) => {
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
      },
      message: (props: any) => `${props.value} is not a valid email address`,
    },
  },
  passwordHash: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  street: {
    type: String,
    required: false,
  },
  zipCode: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
    validate: {
      validator: (value: string) => {
        return /^[+]*[(]?[0-9]{1,4}[)]?[-\s.\/0-9]*$/g.test(value);
      },
      message: (props: any) => `${props.value} is not a valid phone number`,
    },
  },
  businessContracts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessContract",
    },
  ],
  category: {
    type: String,
    ref: "Category",
  },
  licenses: {
    type: [String],
    default: undefined,
    required: false,
  },
  videoUriId: String,
  profilePicture: {
    type: String,
    required: false,
  },
  video: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  instructions: {
    type: [String],
    required: false,
  },
  occupationalSafetyRules: {
    type: [String],
    requeired: false,
  },
  notifications: {
    unread_messages: [
      {
        text: {
          type: String,
          ref: "Message",
        },
      },
    ],
    read_messages: [
      {
        text: {
          type: String,
          ref: "Message",
        },
      },
    ],
    createdAt: {
      type: Date,
      immutable: true,
      default: Date.now,
    },
  },
  contracts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
  ],
  contactPreference: {
    type: String,
  },
  feelings: [
    {
      value: {
        type: Number,
        required: true,
        min: [0, "Feelings can't go below 0"],
        max: [4, "Feelings can't be above 4"],
      },
      note: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
      },
      fileUrl: {
        type: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(mongoosePaginate);

userSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    delete returnedObject.passwordHash;
  },
});

export default mongoose.model<IUserDocument>("User", userSchema);
