import {IAgencyDocument, IBusinessDocument, IBusinessContractDocument, IFeelings, IForm, IWorkContractDocument, IWorkerDocument} from "./modelTypes";

export interface IBaseBody {
  userId: string,
  agency?: IAgencyDocument,
  business?: IBusinessDocument,
  worker?: IWorkerDocument,
  userInWorkContract?: boolean,
  userInBusinessContract?: boolean,
  workContract?: IWorkContractDocument,
  workContractUpdate?: {},
  updateFilterQuery?: {},
  businessContract?: IBusinessContractDocument,
  businessContractUpdate?: {},
  businessContractUpdateFilterQuery?: {},
  workerCount?: number
}

export interface IBodyWithForm extends IBaseBody, IForm {}

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