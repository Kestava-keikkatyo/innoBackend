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

export interface IWorker {
  name: string,
  email: string,
  password: string,
  passwordHash?: string,
  phonenumber: string,
  lisences: Array<string>,
  businessContracts: Array<IBusinessContractDocument['_id']>,
  workContracts: Array<IWorkContractDocument['_id']>,
  feelings: Array<IFeelings>,
  userType: string
}

export interface IWorkerDocument extends Document, Omit<IWorker, "businessContracts" | "workContracts"> {
  _id: Types.ObjectId,
  createdAt: Date,
  businessContracts: Array<IBusinessContractDocument['_id']> | Array<IBusinessContractDocument>,
  workContracts: Array<IWorkContractDocument['_id']> | Array<IWorkContractDocument>,
}

export interface IAgency {
  name: string,
  email: string,
  city: string,
  postnumber: string,
  address: string,
  phonenumber: string,
  securityOfficer: string,
  password: string,
  passwordHash?: string,
  forms: Array<IFormDocument['_id']>,
  businessContracts: Array<IBusinessContractDocument['_id']>,
  workContracts: Array<IWorkContractDocument['_id']>,
  userType: string
}

export interface IAgencyDocument extends Document, Omit<IAgency, "forms" | "businessContracts" | "workContracts"> {
  _id: Types.ObjectId,
  createdAt: Date,
  forms: Array<IFormDocument['_id']> | Array<IFormDocument>,
  businessContracts: Array<IBusinessContractDocument['_id']> | Array<IBusinessContractDocument>,
  workContracts: Array<Types.ObjectId> | Array<IWorkContractDocument>
}

export interface IBusiness {
  name: string,
  email: string,
  city: string,
  postnumber: string,
  address: string,
  phonenumber: string,
  securityOfficer: string,
  password: string,
  passwordHash?: string,
  forms: Array<IFormDocument['_id']>,
  businessContracts: Array<IBusinessContractDocument['_id']>,
  workContracts: Array<Types.ObjectId>,
  userType: string
}

export interface IBusinessDocument extends Document, Omit<IBusiness, "forms" | "businessContracts" | "workContracts"> {
  _id: Types.ObjectId,
  createdAt: Date,
  forms: Array<IFormDocument['_id']> | Array<IFormDocument>,
  businessContracts: Array<IBusinessContractDocument['_id']> | Array<IBusinessContractDocument>,
  workContracts: Array<Types.ObjectId> | Array<IWorkContractDocument>
}

export interface IBusinessContract {
  contractMade: boolean,
  worker: IWorkerDocument['_id'], // Todo can't some of these be optional?
  business: IBusinessDocument['_id'],
  agency: IAgencyDocument['_id'],
  contractType: string
}

export interface IBusinessContractDocument extends Document, Omit<IBusinessContract, "worker" | "business" | "agency"> {
  _id: Types.ObjectId,
  createdAt: Date,
  worker: IWorkerDocument['_id'] | IWorkerDocument, // Todo can't some of these be optional?
  business: IBusinessDocument['_id'] | IBusinessDocument,
  agency: IAgencyDocument['_id'] | IAgencyDocument,
}

export interface IWorkContract {
  business: IBusinessDocument['_id'],
  agency: IAgencyDocument['_id'],
  contracts: Array<ISubContractDocument>
}

export interface IWorkContractDocument extends Document, Omit<IWorkContract, "business" | "agency"> {
  _id: Types.ObjectId,
  business: IBusinessDocument['_id'] | IBusinessDocument,
  agency: IAgencyDocument['_id'] | IAgencyDocument
}

export interface ISubContract {
  workers: Array<IWorkerDocument['_id']>,
  workerCount: number,
  acceptedAgency: boolean,
  acceptedBusiness: boolean,
  validityPeriod: {
    startDate: Date,
    endDate: Date
  }
}

export interface ISubContractDocument extends Document, Omit<ISubContract, "workers"> {
  _id: Types.ObjectId,
  createdAt: Date,
  workers: Array<IWorkerDocument['_id'] | IWorkerDocument>
}
// Used when we want to type docs given in req.body. For calls with {lean: true} option, use DocumentDefinition<IFormDocument> for result type
export interface IForm {
  title: string,
  isPublic: boolean,
  description?: string,
  questions?: IQuestions,
  tags?: Array<string>,
}

export interface IFormDocument extends Document, IForm {
  _id: Types.ObjectId,
  createdAt: Date
}

export interface FormModel<T extends Document> extends PaginateModel<T> {} // Used so Form.paginate can be used