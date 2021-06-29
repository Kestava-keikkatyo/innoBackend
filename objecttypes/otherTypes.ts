import {
  IAgencyDocument,
  IBusinessDocument,
  IBusinessContractDocument,
  IFeelings,
  IForm,
  IWorkContractDocument,
  IWorkerDocument,
  IProfilePage
} from "./modelTypes";

export interface IBaseBody {
  cover: any,
  profilePicture: any,
  userInformation: any,
  contactInformation: any,
  video: any,
  instructions: any,
  profileId: any,
  form: string,
  userId: string,
  agency?: IAgencyDocument,
  business?: IBusinessDocument,
  worker?: IWorkerDocument,
  userInWorkContract?: boolean,
  userInBusinessContract?: boolean,
  workContract?: IWorkContractDocument,
  workContractUpdate?: {},
  workersArray?: Array<IWorkerDocument['_id']>,
  updateFilterQuery?: {},
  businessContract?: IBusinessContractDocument,
  businessContractUpdate?: {},
  businessContractUpdateFilterQuery?: {},
  workerCount?: number
}

export interface IBodyWithForm extends IBaseBody, IForm {}

export interface IBodyWithProfile extends IBaseBody, IProfilePage {}

export interface IBodyWithFeelings extends IBaseBody, IFeelings {}

export interface IBodyLogin {
  email: string,
  password: string
}

export interface IRemovedTraces {
  workerTraceRemoved?: boolean,
  businessTraceRemoved?: boolean,
  agencyTraceRemoved?: boolean,
  error?: string
}

export interface IContractTracesRemoved {
  success: boolean,
  error?: string
}

export interface IBodyWithIds extends IBaseBody {
  businessId?: string,
  agencyId?: string,
  workerId?: string
}