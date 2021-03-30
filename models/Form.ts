import mongoose, {Schema, Document} from "mongoose"
import mongoosePaginate from 'mongoose-paginate-v2'
//import mongoose_fuzzy_searching from 'mongoose-fuzzy-searching' Doesn't work. Doesn't have a types file for ts
import { error as _error } from "../utils/logger"

export interface IForm extends Document {
  title: string,
  isPublic: boolean,
  description: string,
  questions: Object,
  tags: Array<string>
  createdAt: Date
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
      title: {
        type: String,
        minlength: 0,
        maxlength: 1000,
        required: true
      },
      questionType: {
        type: String,
        match: "^comment$"
      }
    }],
    text: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
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
      },
      questionType: {
        type: String,
        match: "^text$"
      }
    }],
    textarea: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
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
      },
      rows: {
        type: Number,
        min: 0,
        max: 50,
        required: true
      },
      questionType: {
        type: String,
        match: "^textarea$"
      }
    }],
    checkbox: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      questionType: {
        type: String,
        match: "^checkbox$"
      }
    }],
    checkbox_group: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      options: [{
        type: String,
        minlength: 0,
        maxlength: 200
      }],
      questionType: {
        type: String,
        match: "^checkbox_group$"
      }
    }],
    radiobutton_group: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      options: [{
        type: String,
        minlength: 0,
        maxlength: 200
      }],
      questionType: {
        type: String,
        match: "^radiobutton_group$"
      }
    }],
    radiobutton_group_horizontal: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
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
      scaleOptionTitleLeft: {
        type: String,
        minlength: 0,
        maxlength: 75
      },
      scaleOptionTitleCenter: {
        type: String,
        minlength: 0,
        maxlength: 75
      },
      scaleOptionTitleRight: {
        type: String,
        minlength: 0,
        maxlength: 75
      },
      questionType: {
        type: String,
        match: "^radiobutton_group_horizontal$"
      }
    }],
    contact_information: [{
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
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      optional: {
        type: Boolean,
        required: true
      },
      questionType: {
        type: String,
        match: "^contact_information$"
      }
    }],
    datepicker: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      isClosedTimeFrame: {
        type: Boolean,
        required: true
      },
      questionType: {
        type: String,
        match: "^datepicker$"
      }
    }],
    timepicker: [{
      ordering: {
        type: Number,
        min: 0,
        max: 99,
        required: true
      },
      title: {
        type: String,
        minlength: 0,
        maxlength: 200,
        required: true
      },
      subtitle: {
        type: String,
        minlength: 0,
        maxlength: 500
      },
      isClosedTimeFrame: {
        type: Boolean,
        required: true
      },
      questionType: {
        type: String,
        match: "^timepicker$"
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
}, {
  autoIndex: true
})

formSchema.plugin(mongoosePaginate)

formSchema.index(
    { title: "text", description: "text", tags: "text" },
    { name: "search_index", weights: { title: 3, description: 1, tags: 2 } }
    )

const FormModel = mongoose.model<IForm>("Form", formSchema)
FormModel.on("index", (error: Error) => {
  if (error) {
    _error(error.message+"\n"+error)
  }
})

export default FormModel