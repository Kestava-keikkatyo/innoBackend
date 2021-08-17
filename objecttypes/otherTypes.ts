import {
  IAgencyDocument,
  IBusinessDocument,
  IBusinessContractDocument,
  IFeelings,
  IForm,
  IWorkContractDocument,
  IWorkerDocument,
  IProfile
} from "./modelTypes";

export interface IBaseBody {
  startDate: string,
  endDate: string,
  workerCount: string,
  headline: string,
  detailedInfo: string,
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
}

export interface IBodyWithForm extends IBaseBody, IForm {}

export interface IBodyWithProfile extends IBaseBody, IProfile {}

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