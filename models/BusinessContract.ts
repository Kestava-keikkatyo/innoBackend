import mongoose, {Schema} from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import {IBusinessContractDocument} from "../objecttypes/modelTypes"

const businessContractSchema = new Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  receivedContracts: {
    businesses: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business"
      }
    }],
    workers: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
      }
    }]
  },
  madeContracts: {
    businesses: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business"
      }
    }],
    workers: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
      }
    }]
  },
  requestContracts: {
    businesses: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business"
      }
    }],
    workers: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
      }
    }]  
  },
  pendingContracts: {
    businesses: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business"
      }
    }],
    workers: [{
      formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Form"
      },
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
      }
    }] 
  }
})

businessContractSchema.plugin(uniqueValidator)

export default mongoose.model<IBusinessContractDocument>("BusinessContract", businessContractSchema)