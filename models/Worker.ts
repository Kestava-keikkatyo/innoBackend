import mongoose, { Schema } from "mongoose";
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from "mongoose-paginate-v2";
import { IWorkerDocument } from "../objecttypes/modelTypes";
//https://mongoosejs.com/docs/validation.html
// todo email validator tarkistettava toimiiko halutulla tavalla, samoin phonenumber validator

const workerSchema = new Schema({
  name: {
    type: String,
    minlength: 3,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    immutable: true,
    validate: {
      validator: (value: string) => {
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
      },
      message: (props: any) => `${props.value} is not a valid email address`,
    },
    required: [true, "User email required"],
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  phonenumber: {
    type: String,
    validate: {
      validator: (value: string) => {
        // https://regexr.com/3c53v
        return /^[+]*[(]?[0-9]{1,4}[)]?[-\s.\/0-9]*$/g.test(value);
      },
      message: (props: any) => `${props.value} is not a valid phone number`,
    },
  },
  licenses: [
    {
      type: String,
      minlength: 3,
    },
  ],
  forms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
  ],
  businessContractForms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
  ],
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
  businessContracts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessContract",
    },
  ],
  workContracts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkContract",
    },
  ],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notifications"
  }],
  feedBack: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeedBack"
  }],
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
        type: String
      }
    },
  ],
  userType: {
    type: String,
    default: "Worker",
  },
  active: {
    type: Boolean,
    default: true
  }
});

workerSchema.plugin(mongoosePaginate);

workerSchema.set("toJSON", {
  transform: (_document: any, returnedObject: any) => {
    delete returnedObject.passwordHash;
  },
});

export default mongoose.model<IWorkerDocument>("Worker", workerSchema);
