import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IFormDocument } from "../objecttypes/modelTypes";

const formSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      minlength: 0,
      maxlength: 1000,
      required: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
    },
    description: {
      type: String,
      minlength: 0,
      maxlength: 1000,
    },
    filled: {
      type: Boolean,
      required: true,
    },
    common: {
      type: Boolean,
      required: true,
    },
    submissions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        answers: [
          {
            questionId: {
              type: String,
              unique: true,
              sparse: true,
              required: true,
            },
            answer: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    questions: [
      {
        title: {
          type: String,
          minlength: 0,
          maxlength: 1000,
          required: true,
        },
        questionType: {
          type: String,
          enum: [
            "comment",
            "text",
            "textarea",
            "checkbox",
            "checkbox_group",
            "contact_information",
            "radiobutton_group",
            "radiobutton_group_horizontal",
            "datepicker",
            "timepicker",
          ],
        },
        subTitle: {
          type: String,
          minlength: 0,
          maxlength: 1000,
        },
        optional: {
          type: Boolean,
          required: true,
        },
        answerMaxLength: {
          type: Number,
          required: true,
        },
        answerMinLength: {
          type: Number,
          required: true,
        },
        rows: {
          type: Number,
          min: 0,
          max: 50,
          required: true,
        },
        checked: {
          type: Boolean,
        },
        options: [
          {
            type: String,
            minlength: 0,
            maxlength: 500,
          },
        ],
        optionValues: [
          {
            type: Object,
          },
        ],
        scale: {
          type: Number,
          required: true,
        },
        scaleOptionTitleLeft: {
          type: String,
          minlength: 0,
          maxlength: 75,
        },
        scaleOptionTitleCenter: {
          type: String,
          minlength: 0,
          maxlength: 75,
        },
        scaleOptionTitleRight: {
          type: String,
          minlength: 0,
          maxlength: 75,
        },
        contactInfoAnswer: {
          type: Object,
        },
        isClosedTimeFrame: {
          type: Boolean,
          required: false,
        },
      },
    ],
    /*questionsOld: {
      comment: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          questionType: {
            type: String,
            match: "^comment$",
          },
        },
      ],
      text: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          answer: {
            type: String,
          },
          answerMaxLength: {
            type: Number,
            required: true,
          },
          answerMinLength: {
            type: Number,
            required: true,
          },
          questionType: {
            type: String,
            match: "^text$",
          },
        },
      ],
      textarea: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          answer: {
            type: String,
          },
          answerMaxLength: {
            type: Number,
            required: true,
          },
          answerMinLength: {
            type: Number,
            required: true,
          },
          rows: {
            type: Number,
            min: 0,
            max: 50,
            required: true,
          },
          questionType: {
            type: String,
            match: "^textarea$",
          },
        },
      ],
      checkbox: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          checked: {
            type: Boolean,
          },
          questionType: {
            type: String,
            match: "^checkbox$",
          },
        },
      ],
      checkbox_group: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          options: [
            {
              type: String,
              minlength: 0,
              maxlength: 500,
            },
          ],
          optionValues: [
            {
              type: Object,
            },
          ],
          questionType: {
            type: String,
            match: "^checkbox_group$",
          },
        },
      ],
      radiobutton_group: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          options: [
            {
              type: String,
              minlength: 0,
              maxlength: 500,
            },
          ],
          optionValues: [
            {
              type: Object,
            },
          ],
          questionType: {
            type: String,
            match: "^radiobutton_group$",
          },
        },
      ],
      radiobutton_group_horizontal: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          options: [String],
          optionValues: [
            {
              type: Object,
            },
          ],
          scale: {
            type: Number,
            required: true,
          },
          scaleOptionTitleLeft: {
            type: String,
            minlength: 0,
            maxlength: 75,
          },
          scaleOptionTitleCenter: {
            type: String,
            minlength: 0,
            maxlength: 75,
          },
          scaleOptionTitleRight: {
            type: String,
            minlength: 0,
            maxlength: 75,
          },
          questionType: {
            type: String,
            match: "^radiobutton_group_horizontal$",
          },
        },
      ],
      contact_information: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 1000,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 1000,
          },
          optional: {
            type: Boolean,
            required: true,
          },
          contactInfoAnswer: {
            type: Object,
          },
          questionType: {
            type: String,
            match: "^contact_information$",
          },
        },
      ],
      datepicker: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 200,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 500,
          },
          isClosedTimeFrame: {
            type: Boolean,
            required: false,
          },
          answer: {
            type: String,
          },
          questionType: {
            type: String,
            match: "^datepicker$",
          },
          optional: {
            type: Boolean,
            required: true,
          },
        },
      ],
      timepicker: [
        {
          ordering: {
            type: Number,
            min: 0,
            max: 99,
            required: true,
          },
          title: {
            type: String,
            minlength: 0,
            maxlength: 200,
            required: true,
          },
          subtitle: {
            type: String,
            minlength: 0,
            maxlength: 500,
          },
          isClosedTimeFrame: {
            type: Boolean,
            required: false,
          },
          answer: {
            type: String,
          },
          questionType: {
            type: String,
            match: "^timepicker$",
          },
          optional: {
            type: Boolean,
            required: true,
          },
        },
      ],
    },*/
    tags: [
      {
        type: String,
        minlength: 0,
        maxlength: 20,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    autoIndex: true,
  }
);

formSchema.plugin(mongoosePaginate);

export default mongoose.model<IFormDocument>("Form", formSchema);
