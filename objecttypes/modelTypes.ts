import { Document, PaginateModel, Types } from "mongoose";

// Typing for a workers feeling object
export interface IFeeling {
  worker: IUserDocument["_id"];
  feeling: number;
  comment?: string;
}

export interface IFeelingDocument extends Document, IFeeling {
  _id: Types.ObjectId;
  createdAt: Date;
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

export interface IForm {
  user: IUserDocument["_id"];
  title: string;
  isPublic: boolean;
  filled: boolean;
  common: boolean;
  description?: string;
  questions?: Array<AnyQuestion>;
  tags?: Array<string>;
}

export interface IFormDocument extends Document, IForm {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface FormModel<T extends Document> extends PaginateModel<T> {} // Used so Form.paginate has typing information

export interface INotification {
  sender: IUserDocument["_id"];
  target: Types.ObjectId;
  targetDoc: "WorkRequest" | "Agreement" | "EmploymentAgreement" | "Form" | "Application" | "FeedBack";
  type: "assignment" | "signature_pending" | "form_pending" | "application_pending" | "feedback_pending" | "reply";
}

export interface INotificationDocument extends Document, INotification {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IFeedback {
  senderId: IUserDocument["_id"];
  senderFirstName: IUserDocument["firstName"];
  senderLastName: IUserDocument["lastName"];
  recipientId: IUserDocument["_id"];
  recipientFirstName: IUserDocument["firstName"];
  recipientLastName: IUserDocument["lastName"];
  shift: number;
  shiftMessage: string;
  orientation: number;
  orientationMessage: string;
  reception: number;
  receptionMessage: string;
  appreciation: number;
  appreciationMessage: string;
  expectation: number;
  expectationMessage: string;
  additionalMessage: string;
  anonymous: boolean;
}

export interface IFeedbackDocument extends Document, IFeedback {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport {
  title: String;
  title2: String;
  details: String;
  details2: String;
  date: Date;
  status: String;
  businessReply: String;
  agencyReply: String;
  user: IUserDocument["_id"];
  business?: IUserDocument["_id"];
  agency?: IUserDocument["_id"];
  // fileUrl: String;
  // fileType: String;
  businessArchived: String;
  agencyArchived: String;
  workerArchived: String;
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
  active: boolean;
  applicants: Array<IUserDocument["_id"]>;
}

export interface IJobDocument extends Document, IJob {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IAgreement {
  creator: IUserDocument["_id"];
  target: IUserDocument["_id"];
  status: String;
}

export interface IAgreementCode {
  creator: IUserDocument["_id"];
  createdAt: Date;
  code: String;
}

export interface IAgreementDocument extends Document, IAgreement {
  _id: Types.ObjectId;
  createdAt?: Date;
  signed: Date;
}

export interface IEmploymentAgreement {
  creator: IUserDocument["_id"];
  worker: IUserDocument["_id"];
  business: IUserDocument["_id"];
  status: String;
}

export interface IEmploymentAgreementDocument extends Document, IEmploymentAgreement {
  _id: Types.ObjectId;
  workerSigned?: Date;
  businessSigned?: Date;
  createdAt?: Date;
}

// Used when we want to type docs given in req.body for example. For calls with {lean: true} option, use DocumentDefinition<IUserDocument> for the result's type
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  password: string;
  passwordHash?: string;
  userType: string;
  active: boolean;
  street: string;
  zipCode: string;
  city: string;
  phoneNumber: string;
  feelings: Array<IFeeling>;
  licenses: Array<string>;
  category: string;
  website: string;
  videoUriId: string;
  instructions: Array<string>;
  occupationalSafetyRules: Array<string>;
  notifications: Array<INotification>;
}

// Used for typing results gotten from db calls.
export interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
  category: string;
  userType: string;
  createdAt: Date;
}

export interface IApplication {
  applicant: IUserDocument["_id"];
  job: IJobDocument["_id"];
  status: string;
  explanation: string;
  fileUrl: string;
}

export interface IApplicationDocument extends Document, IApplication {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface ITopic {
  user: IUserDocument["_id"];
  question: String;
  answer: String;
}

export interface ITopicDocument extends Document, ITopic {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IToken {
  token: String;
  lastUsedAt: Date;
  user: IUserDocument["_id"];
}

export interface ITokenDocument extends Document, IToken {
  _id: Types.ObjectId;
}

export interface IWorkRequest {
  sender: IUserDocument["_id"];
  recipient: IUserDocument["_id"];
  headline: String;
  workersNumber: Number;
  requirements: String;
  desirableSkills: String;
  details: String;
  startDate: Date;
  endDate: Date;
}

export interface IWorkRequestDocument extends Document, IWorkRequest {
  _id: Types.ObjectId;
  createdAt: Date;
}

export interface IResponsibility {
  user: IUserDocument["_id"];
  responsible: String;
  rule: String;
}

export interface IResponsibilityDocument extends Document, IResponsibility {
  _id: Types.ObjectId;
  createdAt: Date;
}

export type FileType = "pdf" | "mp4" | "jpg";

export interface IFileDocument extends Document {
  title: { type: String; required: true };
  description: { type: String; required: true };
  creator: { type: String; required: true };
  uploadDate: { type: Date; required: true };
  contentType: { type: String; required: true };
  file: { type: Buffer; required: true };
}
