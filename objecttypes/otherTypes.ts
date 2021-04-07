import {IAgency, IBusiness, IFeelings, IFormDoc, IWorker} from "./modelTypes";

export interface IBaseBody {
  agency?: IAgency,
  business?: IBusiness,
  worker?: IWorker
}

export interface IBodyWithForm extends IBaseBody, IFormDoc {}

export interface IBodyWithFeelings extends IBaseBody, IFeelings {}