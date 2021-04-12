import {IAgency, IBusiness, IBusinessContract, IFeelings, IFormDoc, IWorkContract, IWorker} from "./modelTypes";

export interface IBaseBody {
  agency?: IAgency,
  business?: IBusiness,
  worker?: IWorker,
  userInWorkContract?: boolean,
  userInBusinessContract?: boolean,
  workContract?: IWorkContract,
  workContractUpdate?: {},
  updateFilterQuery?: {},
  businessContract?: IBusinessContract,
  businessContractUpdate?: {},
  businessContractUpdateFilterQuery?: {},
  workerCount?: number
}

export interface IBodyWithForm extends IBaseBody, IFormDoc {}

export interface IBodyWithFeelings extends IBaseBody, IFeelings {}