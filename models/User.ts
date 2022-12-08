import mongoosePaginate from "mongoose-paginate-v2";
import { IUserDocument } from "../objecttypes/modelTypes";
import mongoose, { Schema } from "mongoose";

// Discriminator key determines the userType
const options = { timestamps: true, discriminatorKey: "userType" };

// TODO: Move user specific fields to the respective user type
const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      minlength: 3,
      required: [true, "User name required"],
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
          return !value || (value > "0" && /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g.test(value));
        },
        message: (props: any) => `${props.value} is not a valid phone number`,
      },
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
    instructions: {
      type: [String],
      required: false,
    },
    occupationalSafetyRules: {
      type: [String],
      required: false,
    },
    notifications: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        target: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: "notifications.targetDoc",
        },
        targetDoc: {
          type: String,
          required: true,
          enum: ["WorkRequest", "Agreement", "Form", "Application", "Feedback"],
        },
        type: {
          type: String,
          enum: ["assignment", "signature_pending", "form_pending", "application_pending", "feedback_pending", "reply"],
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  options
);

userSchema.plugin(mongoosePaginate);

userSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    delete returnedObject.passwordHash;
  },
});

const User = mongoose.model<IUserDocument>("User", userSchema);

export default User;

// "worker" is the userType from discriminatorKey
export const Worker = User.discriminator<IUserDocument>(
  "worker",
  new Schema({
    licenses: {
      type: [String],
      required: false,
    },
    whoAmI: {
      type: String,
      default: "I am a worker",
      required: false,
    },
    feelings: [
      {
        comfortable: {
          type: Number,
          required: false,
          min: [0, "Comfortable can't go below 0"],
          max: [4, "Comfortable can't be above 4"],
        },
        satisfied: {
          type: Number,
          required: false,
          min: [0, "Satisfied can't go below 0"],
          max: [4, "Satisfied can't be above 4"],
        },
        energetic: {
          type: Number,
          required: false,
          min: [0, "Energetic can't go below 0"],
          max: [4, "Energetic can't be above 4"],
        },
        enthusiastic: {
          type: Number,
          required: false,
          min: [0, "Enthusiastic can't go below 0"],
          max: [4, "Enthusiastic can't be above 4"],
        },
        frustrated: {
          type: Number,
          required: false,
          min: [0, "Frustrated can't go below 0"],
          max: [4, "Frustrated can't be above 4"],
        },
        stressed: {
          type: Number,
          required: false,
          min: [0, "Stressed can't go below 0"],
          max: [4, "Stressed can't be above 4"],
        },
        anxious: {
          type: Number,
          required: false,
          min: [0, "Anxious can't go below 0"],
          max: [4, "Anxious can't be above 4"],
        },
        comment: {
          type: String,
        },
        fileUrl: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          immutable: true,
        },
      },
    ],
    agencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    businesses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  })
);

// "agency" is the userType from discriminatorKey
export const Agency = User.discriminator<IUserDocument>(
  "agency",
  new Schema({
    category: {
      type: String,
      ref: "Category",
    },
    website: {
      type: String,
      required: false,
    },
    whoAmI: {
      type: String,
      default: "I am an agency",
      required: false,
    },
    workers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  })
);

// "business" is the userType from discriminatorKey
export const Business = User.discriminator<IUserDocument>(
  "business",
  new Schema({
    category: {
      type: String,
      ref: "Category",
    },
    website: {
      type: String,
      required: false,
    },
    whoAmI: {
      type: String,
      default: "I am a business",
      required: false,
    },
    workers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  })
);

// "admin" is the userType from discriminatorKey
export const Admin = User.discriminator<IUserDocument>("admin", new Schema({}));
