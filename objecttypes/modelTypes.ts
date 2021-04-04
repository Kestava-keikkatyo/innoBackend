import {Document, Schema, PaginateModel} from "mongoose"

export interface IFeelings {
  _id?: any, //Schema.Types.ObjectId Bugi mongodb:n tyypitys-tiedostossa ei salli optionaalin ObjectId-tyyppisen _id:n käyttöä $addToSet:in kanssa.
  value: number,
  note?: string,
  createdAt?: Date
}

export interface IQuestions {
  comment: Array<{
    ordering: number,
    title: string,
    questionType: string
  }>,
  text: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    answerMaxLength: number,
    answerMinLength: number,
    questionType: string
  }>,
  textarea: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    answerMaxLength: number,
    answerMinLength: number,
    rows: number,
    questionType: string
  }>,
  checkbox: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    questionType: string
  }>,
  checkbox_group: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    options: Array<string>,
    questionType: string
  }>,
  radiobutton_group: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    options: Array<string>,
    questionType: string
  }>,
  radiobutton_group_horizontal: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    options: Array<string>,
    scaleOptionTitleLeft: string,
    scaleOptionTitleCenter: string,
    scaleOptionTitleRight: string,
    questionType: string
  }>,
  contact_information: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    optional: boolean,
    questionType: string
  }>,
  date_picker: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    isClosedTimeFrame: boolean,
    questionType: string
  }>,
  time_picker: Array<{
    ordering: number,
    title: string,
    subtitle: string,
    isClosedTimeFrame: boolean,
    questionType: string
  }>,
  [key: string]: any
}

export interface IWorker extends Document {
  _id: Schema.Types.ObjectId,
  name: string,
  email: string,
  passwordHash?: string,
  createdAt: Date,
  phonenumber: string,
  lisences: Array<string>,
  businessContracts: Array<IBusinessContract['_id']> | Array<IBusinessContract>,
  workContracts: Array<IWorkContract['_id']> | Array<IWorkContract>,
  feelings: Array<IFeelings>,
  userType: string
}

export interface IAgency extends Document {
  _id: Schema.Types.ObjectId,
  name: string,
  email: string,
  city: string,
  postnumber: string,
  address: string,
  phonenumber: string,
  securityOfficer: string,
  passwordHash?: string,
  createdAt: Date,
  forms: Array<IForm['_id']> | Array<IForm>,
  businessContracts: Array<IBusinessContract['_id']> | Array<IBusinessContract>,
  workContracts: Array<Schema.Types.ObjectId> | Array<IWorkContract>,
  userType: string
}

export interface IBusiness extends Document {
  _id: Schema.Types.ObjectId,
  name: string,
  email: string,
  city: string,
  postnumber: string,
  address: string,
  phonenumber: string,
  securityOfficer: string,
  passwordHash?: string,
  createdAt: Date,
  forms: Array<IForm['_id']> | Array<IForm>,
  businessContracts: Array<IBusinessContract['_id']> | Array<IBusinessContract>,
  workContracts: Array<Schema.Types.ObjectId> | Array<IWorkContract>,
  userType: string
}

export interface IBusinessContract extends Document {
  _id: Schema.Types.ObjectId,
  contractMade: boolean,
  createdAt: Date,
  worker: IWorker['_id'] | IWorker, // Todo can't some of these be optional?
  business: IBusiness['_id'] | IBusiness,
  agency: IAgency['_id'] | IAgency,
  contractType: string
}

export interface IWorkContract extends Document {
  _id: Schema.Types.ObjectId,
  business: IBusiness['_id'] | IBusiness,
  agency: IAgency['_id'] | IAgency,
  contracts: Array<ISubContract>
}

export interface ISubContract extends Document {
  _id: Schema.Types.ObjectId,
  workers: Array<IWorker['_id'] | IWorker>,
  workerCount: string, // Why not number?
  acceptedAgency: boolean,
  acceptedBusiness: boolean,
  createdAt: Date,
  validityPeriod: {
    startDate: Date,
    endDate: Date
  }
}
/* If DocumentDefinition<IForm> isn't what you're actually supposed to use for docs returned by lean option,
   then we create an interface IFormDoc that IForm will extend in addition to Document. IFormDoc is then used when returning with lean.
export interface IFormDoc {
  title: string,
  isPublic: boolean,
  description: string,
  questions: IQuestions,
  tags: Array<string>,
  createdAt: Date
}
*/
export interface IForm extends Document {
  _id: Schema.Types.ObjectId,
  title: string,
  isPublic: boolean,
  description: string,
  questions: IQuestions,
  tags: Array<string>,
  createdAt: Date
}

export interface FormModel<T extends Document> extends PaginateModel<T> {} // Used so Form.paginate can be used