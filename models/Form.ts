import mongoose, {Schema, Document} from "mongoose";
//const uniqueValidator = require("mongoose-unique-validator")
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IForm extends Document {
  //tähän tyypitys
}

const formSchema = new Schema({
  title: {
    type: String,
    minlength: 0,
    maxlength: 100,
    required: true
  },
  isPublic: {
    type: Boolean,
    required: true
  },
  description: {
    type: String,
    minlength: 0,
    maxlength: 500
  },
  questions: {
    comment: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 1000,
        required: true
      }
    }],
    text: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type:Boolean,
        required: true
      },
      answerMaxLength: {
        type: Number,
        required: true
      },
      answerMinLength: {
        type: Number,
        required: true
      }
    }],
    textarea: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type:Boolean,
        required: true
      },
      answerMaxLength: {
        type: Number,
        required: true
      },
      answerMinLength: {
        type: Number,
        required: true
      }
    }],
    checkbox: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      }
    }],
    checkbox_group: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      options: [String]
    }],
    radiobutton_group: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      options: [String]
    }],
    radiobutton_group_horizontal: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      options: [String],
      scale: {
        type: Number,
        required: true
      },
      scaleOptionTitleLeft: String,
      scaleOptionTitleCenter: String,
      scaleOptionTitleRight: String
    }],
    contactInformation: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      phoneNumber: {
        type: String,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      }
    }],
    datePicker: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      isClosedTimeFrame: {
        type: Boolean,
        required: true
      }
    }],
    timePicker: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      questionTitle: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      questionSubTitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      isClosedTimeFrame: {
        type: Boolean,
        required: true
      }
    }]
  },
  tags: [{
    type: String,
    minlength: 0,
    maxlength: 20
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
})

formSchema.plugin(mongoosePaginate)

formSchema.set("toJSON", {
  transform: (_doc: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

export default mongoose.model<IForm>("Form", formSchema)