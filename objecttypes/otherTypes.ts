import {IAgencyDocument, IBusinessDocument, IBusinessContractDocument, IFeelings, IForm, IWorkContractDocument, IWorkerDocument} from "./modelTypes";

export interface IBaseBody {
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