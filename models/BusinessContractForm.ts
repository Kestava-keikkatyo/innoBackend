import mongoose, { Schema } from "mongoose"
import mongoosePaginate from 'mongoose-paginate-v2'
import { IFormDocument, FormModel } from "../objecttypes/modelTypes"
import { error as _error } from "../utils/logger"

const businessContractFormSchema = new Schema({
    title: {
        type: String,
        minlength: 0,
        maxlength: 1000,
        required: true
    },
    isPublic: {
        type: Boolean,
        required: true
    },
    description: {
        type: String,
        minlength: 0,
        maxlength: 1000
    },
    filled: {
        type: Boolean,
        required: true
    },
    common: {
        type: Boolean,
        required: true
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
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            answer: {
                type: String
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
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            answer: {
                type: String
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
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            checked: {
                type: Boolean
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
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            options: [{
                type: String,
                minlength: 0,
                maxlength: 500
            }],
            optionValues: [{
                type: Object
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
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            options: [{
                type: String,
                minlength: 0,
                maxlength: 500
            }],
            optionValues: [{
                type: Object
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
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            options: [String],
            optionValues: [{
                type: Object
            }],
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
            title: {
                type: String,
                minlength: 0,
                maxlength: 1000,
                required: true
            },
            subtitle: {
                type: String,
                minlength: 0,
                maxlength: 1000
            },
            optional: {
                type: Boolean,
                required: true
            },
            contactInfoAnswer: {
                type: Object
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
                required: false
            },
            answer: {
                type: String
            },
            questionType: {
                type: String,
                match: "^datepicker$"
            },
            optional: {
                type: Boolean,
                required: true
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
                required: false
            },
            answer: {
                type: String
            },
            questionType: {
                type: String,
                match: "^timepicker$"
            },
            optional: {
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
}, {
    autoIndex: true
})

businessContractFormSchema.plugin(mongoosePaginate)

businessContractFormSchema.index(
    { title: "text", description: "text", tags: "text" },
    { name: "search_index", weights: { title: 3, description: 1, tags: 2 } }
)

const BusinessContractFormModel: FormModel<IFormDocument> = mongoose.model<IFormDocument>("BusinessContractForm", businessContractFormSchema) as FormModel<IFormDocument>

BusinessContractFormModel.on("index", (error: Error) => {
    if (error) {
        _error(error.message + "\n\n" + error)
    }
})

export default BusinessContractFormModel