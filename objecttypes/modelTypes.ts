import {Document, PaginateModel, Types} from "mongoose"

export interface IFeelings {
  _id?: Types.ObjectId,
  value: number,
  note?: string,
  createdAt?: Date
}

export interface IComment {
  ordering: number,
  title: string,
  questionType: string
}

export interface IBaseQuestion {
  ordering: number,
  title: string,
  subtitle: string,
  optional: boolean,
  questionType: string
}

export interface ITextQuestion extends IBaseQuestion {
  answerMaxLength: number,
  answerMinLength: number
}

export interface ITextareaQuestion extends IBaseQuestion {
  answerMaxLength: number,
  answerMinLength: number,
  rows: number
}

export interface ICheckboxQuestion extends IBaseQuestion {}

export interface ICheckboxGroupQuestion extends IBaseQuestion {
  options: Array<string>
}

export interface IRadiobuttonGroupQuestion extends IBaseQuestion {
  options: Array<string>
}

export interface IRadiobuttonGroupHorizontalQuestion extends IBaseQuestion {
  options: Array<string>,
  scaleOptionTitleLeft: string,
  scaleOptionTitleCenter: string,
  scaleOptionTitleRight: string
}

export interface IContactInformationQuestion extends IBaseQuestion {}

export interface IDatePickerQuestion extends IBaseQuestion {
  isClosedTimeFrame: boolean
}

export interface ITimePickerQuestion extends IBaseQuestion {
  isClosedTimeFrame: boolean
}

export type AnyQuestion = IComment | ITextQuestion | ITextareaQuestion | ICheckboxQuestion | ICheckboxGroupQuestion | IRadiobuttonGroupQuestion | IRadiobuttonGroupHorizontalQuestion | IContactInformationQuestion | IDatePickerQuestion | ITimePickerQuestion


export interface IQuestions {
  comment: Array<IComment>,
  text: Array<ITextQuestion>,
  textarea: Array<ITextareaQuestion>,
  checkbox: Array<ICheckboxQuestion>,
  checkbox_group: Array<ICheckboxGroupQuestion>,
  radiobutton_group: Array<IRadiobuttonGroupQuestion>,
  radiobutton_group_horizontal: Array<IRadiobuttonGroupHorizontalQuestion>,
  contact_information: Array<IContactInformationQuestion>,
  date_picker: Array<IDatePickerQuestion>,
  time_picker: Array<ITimePickerQuestion>,
  [key: string]: Array<AnyQuestion>
}

export interface IWorker extends Document {
  _id: Types.ObjectId,
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
  _id: Types.ObjectId,
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
  workContracts: Array<Types.ObjectId> | Array<IWorkContract>,
  userType: string
}

export interface IBusiness extends Document {
  _id: Types.ObjectId,
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
  workContracts: Array<Types.ObjectId> | Array<IWorkContract>,
  userType: string
}

export interface IBusinessContract extends Document {
  _id: Types.ObjectId,
  contractMade: boolean,
  createdAt: Date,
  worker: IWorker['_id'] | IWorker, // Todo can't some of these be optional?
  business: IBusiness['_id'] | IBusiness,
  agency: IAgency['_id'] | IAgency,
  contractType: string
}

export interface IWorkContract extends Document {
  _id: Types.ObjectId,
  business: IBusiness['_id'] | IBusiness,
  agency: IAgency['_id'] | IAgency,
  contracts: Array<ISubContract>
}

export interface ISubContract extends Document {
  _id: Types.ObjectId,
  workers: Array<IWorker['_id'] | IWorker>,
  workerCount: number,
  acceptedAgency: boolean,
  acceptedBusiness: boolean,
  createdAt: Date,
  validityPeriod: {
    startDate: Date,
    endDate: Date
  }
}
// Used when we want to type docs given in req.body. For calls with {lean: true} option, use DocumentDefinition<IForm> for result type
export interface IFormDoc {
  title: string,
  isPublic: boolean,
  description?: string,
  questions?: IQuestions,
  tags?: Array<string>,
}

export interface IForm extends Document, IFormDoc {
  _id: Types.ObjectId,
  createdAt: Date
}

export interface FormModel<T extends Document> extends PaginateModel<T> {} // Used so Form.paginate can be used