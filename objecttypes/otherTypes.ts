import { IUserDocument } from "./modelTypes";

export interface IBaseBody {
  startDate: string;
  endDate: string;
  workerCount: string;
  headline: string;
  detailedInfo: string;
  form: string;
  userId: string;
  user?: IUserDocument;
  userInWorkContract?: boolean;
  userInBusinessContract?: boolean;
  workContractUpdate?: {};
  updateFilterQuery?: {};
  businessContractUpdate?: {};
  businessContractUpdateFilterQuery?: {};
}

export interface IBodyLogin {
  email: string;
  password: string;
}

export interface IRemovedTraces {
  workerTraceRemoved?: boolean;
  businessTraceRemoved?: boolean;
  agencyTraceRemoved?: boolean;
  error?: string;
}

export interface IContractTracesRemoved {
  success: boolean;
  error?: string;
}

export interface IBodyWithIds extends IBaseBody {
  businessId?: string;
  agencyId?: string;
  workerId?: string;
}
