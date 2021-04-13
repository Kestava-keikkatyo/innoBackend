import {IAgencyDocument, IBusinessDocument, IFeelings, IForm, IWorkerDocument} from "./modelTypes";

export interface IBaseBody {
  agency?: IAgencyDocument,
  business?: IBusinessDocument,
  worker?: IWorkerDocument
}

export interface IBodyWithForm extends IBaseBody, IForm {}

export interface IBodyWithFeelings extends IBaseBody, IFeelings {}

export interface IBodyLogin {
  email: string,
  password: string
}