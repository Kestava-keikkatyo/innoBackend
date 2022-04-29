import {Document, PaginateModel, Types} from "mongoose";

// Typing for a workers feelings object
export interface IFeelings {
  _id?: Types.ObjectId;
  value: number;
  note?: string;
  createdAt?: Date;
  fileUrl?: string;
}

// Typings for Form's questions START
export interface IComment {
  ordering: number;
  title: string;
  questionType: string;
}

export interface IBaseQuestion {
  ordering: number;
  title: string;
  subtitle: string;
  optional: boolean;
  questionType: string;
}

export interface ITextQuestion extends IBaseQuestion {
  answerMaxLength: number;
  answerMinLength: number;
}

export interface ITextareaQuestion extends IBaseQuestion {
  answerMaxLength: number;
  answerMinLength: number;
  rows: number;
}

export interface ICheckboxQuestion extends IBaseQuestion {}

export interface ICheckboxGroupQuestion extends IBaseQuestion {
  options: Array<string>;
}

export interface IRadiobuttonGroupQuestion extends IBaseQuestion {
  options: Array<string>;
}

export interface IRadiobuttonGroupHorizontalQuestion extends IBaseQuestion {
  options: Array<string>;
  scaleOptionTitleLeft: string;
  scaleOptionTitleCenter: string;
  scaleOptionTitleRight: string;
}

export interface IContactInformationQuestion extends IBaseQuestion {}

export interface IDatePickerQuestion extends IBaseQuestion {
  isClosedTimeFrame: boolean;
}

export interface ITimePickerQuestion extends IBaseQuestion {
  isClosedTimeFrame: boolean;
}

export type AnyQuestion =
  | IComment
  | ITextQuestion
  | ITextareaQuestion
  | ICheckboxQuestion
  | ICheckboxGroupQuestion
  | IRadiobuttonGroupQuestion
  | IRadiobuttonGroupHorizontalQuestion
  | IContactInformationQuestion
  | IDatePickerQuestion
  | ITimePickerQuestion;

export interface IQuestions {
  comment: Array<IComment>;
  text: Array<ITextQuestion>;
  textarea: Array<ITextareaQuestion>;
  checkbox: Array<ICheckboxQuestion>;
  checkbox_group: Array<ICheckboxGroupQuestion>;
  radiobutton_group: Array<IRadiobuttonGroupQuestion>;
  radiobutton_group_horizontal: Array<IRadiobuttonGroupHorizontalQuestion>;
  contact_information: Array<IContactInformationQuestion>;
  date_picker: Array<IDatePickerQuestion>;
  time_picker: Array<ITimePickerQuestion>;
  [key: string]: Array<AnyQuestion>;
}
// Typings for Form's questions END

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IAdminDocument> for the result's type
export interface IAdmin {
  name: string;
  email: string;
  password: string;
  passwordHash?: string;
  phonenumber: string;
  userType: string;
  profile: IProfileDocument["_id"];
  active: boolean;
}

// Used for typing results gotten from db calls.
export interface IAdminDocument extends Document, IAdmin {
  _id: Types.ObjectId;
  createdAt: Date;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IWorkerDocument> for the result's type
export interface IWorker {
  name: string;
  email: string;
  password: string;
  passwordHash?: string;
  phonenumber: string;
  licenses: Array<string>;
  businessContracts: Array<IBusinessContractDocument["_id"]>;
  workContracts: {
    requested: Array<IWorkContractDocument["_id"]>;
    accepted: Array<IWorkContractDocument["_id"]>;
    declined: Array<IWorkContractDocument["_id"]>;
  };
  feelings: Array<IFeelings>;
  userType: string;
  profile: IProfileDocument["_id"];
  active: boolean;
}

// Used for typing results gotten from db calls.
export interface IWorkerDocument
  extends Document,
    Omit<IWorker, "businessContracts" | "workContracts"> {
  _id: Types.ObjectId;
  createdAt: Date;
  businessContractForms: Array<IFormDocument["_id"]> | Array<IFormDocument>;
  businessContracts: Array<IBusinessContractDocument["_id"]>;
  workContracts: {
    requested: Array<IWorkContractDocument["_id"]>;
    accepted: Array<IWorkContractDocument["_id"]>;
    declined: Array<IWorkContractDocument["_id"]>;
  };
  notifications: Array<INotificationsDocument["_id"]>;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IAgencyDocument> for the result's type
export interface IAgency {
  name: string;
  email: string;
  city: string;
  postnumber: string;
  address: string;
  phonenumber: string;
  category: string;
  securityOfficer: string;
  password: string;
  passwordHash?: string;
  forms: Array<IFormDocument["_id"]>;
  businessContracts: Array<IBusinessContractDocument["_id"]>;
  workContracts: Array<IWorkContractDocument["_id"]>;
  userType: string;
  profile: IProfileDocument["_id"];
  active: boolean;
}

// Used for typing results gotten from db calls.
export interface IAgencyDocument
  extends Document,
    Omit<IAgency, "forms" | "businessContracts" | "workContracts"> {
  _id: Types.ObjectId;
  createdAt: Date;
  category: string;
  forms: Array<IFormDocument["_id"]> | Array<IFormDocument>;
  businessContractForms: Array<IFormDocument["_id"]> | Array<IFormDocument>;
  businessContracts:
    | Array<IBusinessContractDocument["_id"]>
    | Array<IBusinessContractDocument>;
  workContracts: Array<Types.ObjectId> | Array<IWorkContractDocument>;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IBusinessDocument> for the result's type
export interface IBusiness {
  name: string;
  email: string;
  city: string;
  postnumber: string;
  address: string;
  phonenumber: string;
  category: string;
  securityOfficer: string;
  password: string;
  passwordHash?: string;
  forms: Array<IFormDocument["_id"]>;
  businessContracts: Array<IBusinessContractDocument["_id"]>;
  workContracts: Array<Types.ObjectId>;
  userType: string;
  videoUriId: string;
  instructions: Array<string>;
  workingHours: {
    start: number;
    end: number;
  };
  contactPreference: string;
  socialMedias: Array<string>;
  profile: IProfileDocument["_id"];
  active: boolean;
}

// Used for typing results gotten from db calls.
export interface IBusinessDocument
  extends Document,
    Omit<IBusiness, "forms" | "businessContracts" | "workContracts"> {
  _id: Types.ObjectId;
  createdAt: Date;
  forms: Array<IFormDocument["_id"]> | Array<IFormDocument>;
  businessContractForms: Array<IFormDocument["_id"]> | Array<IFormDocument>;
  businessContracts: Array<IBusinessContractDocument["_id"]>; //| Array<IBusinessContractDocument>
  workContracts: Array<Types.ObjectId> | Array<IWorkContractDocument>;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IBusinessContractDocument> for the result's type
export interface IBusinessContract {
  agency: IAgencyDocument["_id"];
  madeContracts: {
    businesses: Array<IBusinessDocument["_id"]>;
    workers: Array<IWorkerDocument["_id"]>;
  };
  requestContracts: {
    businesses: Array<IBusinessDocument["_id"]>;
    workers: Array<IWorkerDocument["_id"]>;
  };
}

// Used for typing results gotten from db calls.
export interface IBusinessContractDocument
  extends Document,
    Omit<IBusinessContract, "agency" | "madeContracts" | "requestContracts"> {
  _id: Types.ObjectId;
  createdAt: Date;
  agency: IAgencyDocument["_id"] | IAgencyDocument;
  madeContracts: {
    businesses: Array<IBusinessDocument["_id"]>;
    workers: Array<IWorkerDocument["_id"]>;
  };
  requestContracts: {
    businesses: Array<IBusinessDocument["_id"]>;
    workers: Array<IWorkerDocument["_id"]>;
  };
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IWorkContractDocument> for the result's type
export interface IWorkContract {
  business: IBusinessDocument["_id"];
  agency: IAgencyDocument["_id"];
  contracts: Array<ISubContractDocument>;
}

// Used for typing results gotten from db calls.
export interface IWorkContractDocument
  extends Document,
    Omit<IWorkContract, "business" | "agency"> {
  _id: Types.ObjectId;
  createdAt: Date;
  business: IBusinessDocument["_id"] | IBusinessDocument;
  agency: IAgencyDocument["_id"] | IAgencyDocument;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<ISubContractDocument> for the result's type
export interface ISubContract {
  acceptedWorkers: Array<IWorkerDocument["_id"]>;
  requestWorkers: Array<IWorkerDocument["_id"]>;
  workerCount: number;
  acceptedAgency: boolean;
  acceptedBusiness: boolean;
  validityPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

// Used for typing results gotten from db calls.
export interface ISubContractDocument
  extends Document,
    Omit<ISubContract, "acceptedWorkers" | "requestWorkers"> {
  _id: Types.ObjectId;
  createdAt: Date;
  acceptedWorkers: Array<IWorkerDocument["_id"]> | Array<IWorkerDocument>;
  requestWorkers: Array<IWorkerDocument["_id"]> | Array<IWorkerDocument>;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IFormDocument> for the result's type
export interface IForm {
  title: string;
  isPublic: boolean;
  filled: boolean;
  common: boolean;
  description?: string;
  questions?: IQuestions;
  tags?: Array<string>;
}

// Used for typing results gotten from db calls.
export interface IFormDocument extends Document, IForm {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IForm2 {
  user: IUserDocument["_id"];
  title: string;
  isPublic: boolean;
  filled: boolean;
  common: boolean;
  description?: string;
  questions?: Array<AnyQuestion>;
  tags?: Array<string>;
}

export interface IForm2Document extends Document, IForm2 {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface FormModel<T extends Document> extends PaginateModel<T> {} // Used so Form.paginate has typing information

export interface IProfile {
  name: string;
  phone: string;
  email: string;
  streetAddress: string;
  zipCode: string;
  city: string;
  coverPhoto: string;
  profilePicture: string;
  video: string;
  website: string;
  instructions: any[];
  occupationalSafetyRules: any[];
}

export interface IProfileDocument extends Document, IProfile {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface INotifications {
  userId:
    | IWorkerDocument["_id"]
    | IBusinessDocument["_id"]
    | IAgencyDocument["_id"]
    | IAdminDocument["_id"];
  message: String;
  is_read: Boolean;
  createdAt: Date;
}

export interface INotificationsDocument extends Document, INotifications {
  _id: Types.ObjectId;
}

export interface IFeedback {
  user: IUserDocument["_id"];
  message: String;
}

export interface IFeedbackDocument extends Document, IFeedback {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IReport {
  title: String;
  details: String;
  date: Date;
  status: String;
  reply: String;
  user: IUserDocument["_id"];
  receiver: IUserDocument["_id"];
  fileUrl: String;
  fileType: String;
}

export interface IReportDocument extends Document, IReport {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IJob {
  user: IUserDocument["_id"];
  title: String;
  category: String;
  jobType: String;
  street: string;
  zipCode: string;
  city: string;
  salary: Number;
  requirements: String;
  desirableSkills: String;
  benefits: String;
  details: String;
  startDate: Date;
  endDate: Date;
  applicationLastDate: Date;
  applicants: Array<IUserDocument["_id"]>;
}

export interface IJobDocument extends Document, IJob {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IAgreement {
  creator: IUserDocument["_id"];
  target: IUserDocument["_id"];
  form2: Array<IForm2Document>[];
  type: string;
  status: string;
}

export interface IAgreementDocument extends Document, IAgreement {
  _id: Types.ObjectId;
  createdAt: Date;
  signed: Date;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IUserDocument> for the result's type
export interface IUser {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordHash?: string;
  userType: string;
  active: boolean;
  street: string;
  zipCode: string;
  city: string;
  phoneNumber: string;
  feelings: Array<IFeelings>;
  licenses: Array<string>;
  category: string;
  website: string;
  videoUriId: string;
  instructions: Array<string>;
  occupationalSafetyRules: Array<string>;
  notifications: {
    unread_messages: Array<string>;
    read_messages: Array<string>;
    createdAt: Date;
  };
}

// Used for typing results gotten from db calls.
export interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
  category: string;
  userType: string;
  createdAt: Date;
}

export interface IApplication {
  user: IUserDocument["_id"];
  job: IJobDocument["_id"];
  status: string;
}

export interface IApplicationDocument extends Document, IApplication {
  _id: Types.ObjectId;
  createdAt: Date;
}
