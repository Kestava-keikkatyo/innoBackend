/** Contains all callback functions that use callback.
 * @module utils/common
 * @requires Worker
 * @requires Business
 * @requires Agency
 */
import Worker from "../models/Worker";
import Business from "../models/Business";
import Agency from "../models/Agency";
import { error as _error } from "../utils/logger";
import {
  CallbackError,
  DocumentDefinition,
  PaginateResult,
  /*Model,*/ Types,
} from "mongoose";
import {
  IAgencyDocument,
  IBusinessDocument,
  /*IBusinessContract, IWorkContract,*/ IWorkerDocument,
} from "../objecttypes/modelTypes";
import { IBaseBody, IRemovedTraces } from "../objecttypes/otherTypes";
/**
 * Checks if a worker with param id exists.
 * @param {string} id
 * @param {Function} callback
 * @returns Worker Object if worker exists, null if not.
 */
export const workerExistsCallback = (
  id: string | Types.ObjectId,
  callback: (result: IWorkerDocument | null) => void
): void => {
  try {
    Worker.findById(
      id,
      (error: CallbackError, result: IWorkerDocument | null) => {
        if (error) {
          _error(error);
          callback(null);
        } else if (!result) {
          callback(null);
        } else {
          callback(result);
        }
      }
    );
  } catch (exception) {
    _error(exception);
    callback(null);
  }
};

/**
 * Checks if a business with param id exists.
 * @param {String} id
 * @param {Function} callback
 * @returns {IBusinessDocument|null} Business Object if worker exists, null if not.
 */
export const businessExistsCallback = (
  id: string,
  callback: (result: IBusinessDocument | null) => void
): void => {
  try {
    Business.findById(
      id,
      (error: CallbackError, result: IBusinessDocument | null) => {
        if (error) {
          _error(error);
          callback(null);
        } else if (!result) {
          callback(null);
        } else {
          callback(result);
        }
      }
    );
  } catch (exception) {
    _error(exception);
    callback(null);
  }
};

/**
 * Deletes traces of failed WorkContract from business, agency and user collection.
 * If you don't wanna delete some references you can leave id value ass null.
 * This function is used in workcontract.js in POST workcontract route.
 * @param {string} workerId Workers Id - used to find right worker / can be null
 * @param {string} businessId Business Id - used to find right business / can be null
 * @param {string} agencyId Agency ObjecId - used to find right agency / can be null
 * @param {string} contractToCreateid ContractId - contract that failed save to db
 * @param {Function} callback
 * @returns {Boolean} {workerTraceRemoved,businessTraceRemoved,agencyTraceRemoved}
 */
export const deleteTracesOfFailedWorkContract = async (
  workerId: string | null,
  businessId: string | null,
  agencyId: string | null,
  contractToCreateid: string,
  callback: (result: IRemovedTraces) => void
): Promise<void> => {
  try {
    //Needs some kind of check
    let workerTraceRemoved: boolean | undefined;
    let businessTraceRemoved: boolean | undefined;
    let agencyTraceRemoved: boolean | undefined;
    //if business
    if (businessId !== null) {
      await Business.findByIdAndUpdate(
        { _id: businessId },
        { $pull: { workContracts: { $in: [contractToCreateid.toString()] } } },
        { multi: false, lean: true },
        (
          error: CallbackError,
          result: DocumentDefinition<IBusinessDocument> | null
        ) => {
          businessTraceRemoved = !(error || !result); // False if error or !result, true otherwise
        }
      );
    }
    //if agency
    if (agencyId !== null) {
      await Agency.findByIdAndUpdate(
        { _id: agencyId },
        { $pull: { workContracts: { $in: [contractToCreateid.toString()] } } },
        { multi: false, lean: true },
        (
          error: CallbackError,
          result: DocumentDefinition<IAgencyDocument> | null
        ) => {
          agencyTraceRemoved = !(error || !result); // False if error or !result, true otherwise
        }
      );
    }
    //if worker
    if (workerId !== null) {
      await Worker.findByIdAndUpdate(
        { _id: workerId },
        { $pull: { workContracts: { $in: [contractToCreateid.toString()] } } },
        { multi: false, lean: true },
        (
          error: CallbackError,
          result: DocumentDefinition<IWorkerDocument> | null
        ) => {
          workerTraceRemoved = !(error || !result); // False if error or !result, true otherwise
        }
      );
    }
    return callback({
      workerTraceRemoved,
      businessTraceRemoved,
      agencyTraceRemoved,
    });
  } catch (exception) {
    callback(exception);
  }
};

/**
 * Deletes traces of business contract. Used businesscontract.delete route is used.
 * If trace is deleted adds boolean true to variable.
 * One of the returned values workerTraceRemoved or businessTraceRemoved is undefined.
 * @param {BusinessContract} contract
 * @param {Function} callback
 * @returns {Boolean} workerTraceRemoved, boolean businessTraceRemoved, boolean agencyTraceRemoved
 */
export const deleteTracesOfBusinessContract = async (
  workerId: string | null,
  businessId: string | null,
  contractToCreateid: string,
  callback: (result: IRemovedTraces) => void
) => {
  try {
    let workerTraceRemoved: boolean | undefined = undefined;
    let businessTraceRemoved: boolean | undefined = undefined;
    //check which businesscontract is in question
    if (workerId !== null) {
      await Worker.findByIdAndUpdate(
        workerId,
        { $pull: { businessContracts: { $in: [contractToCreateid] } } },
        { multi: false, lean: true },
        (
          error: CallbackError,
          result: DocumentDefinition<IWorkerDocument> | null
        ) => {
          workerTraceRemoved = !(error || !result); // if error or !result it's false, otherwise true
        }
      );
    }
    if (businessId !== null) {
      await Business.findByIdAndUpdate(
        businessId,
        { $pull: { businessContracts: { $in: [contractToCreateid] } } },
        { multi: false, lean: true },
        (
          error: CallbackError,
          result: DocumentDefinition<IBusinessDocument> | null
        ) => {
          businessTraceRemoved = !(error || !result); // if error or !result it's false, otherwise true
        }
      );
    }
    callback({ workerTraceRemoved, businessTraceRemoved });
  } catch (exception) {
    callback(exception);
  }
};

/**
 * Function that returns the forms of the agency or business, depending on which is provided in the body.
 * @param body the body of the request
 */
export const getAgencyOrBusinessOwnForms = (
  body: IBaseBody
): Array<Types.ObjectId> | null => {
  try {
    let myForms = null;
    if (body.agency) {
      myForms = body.agency.forms as Array<Types.ObjectId>;
    } else if (body.business) {
      myForms = body.business.forms as Array<Types.ObjectId>;
    }
    return myForms;
  } catch (exception) {
    return exception;
  }
};

/**
 * Function that paginates an array, and returns it as an object
 * that is identical to what mongoose-paginate-v2 library returns.
 * @param page The page we want
 * @param limit The max number of items in a page
 * @param arrayToPaginate The array we want to paginate
 */
export const buildPaginatedObjectFromArray = (
  page: number,
  limit: number,
  arrayToPaginate: Array<any>
): PaginateResult<any> => {
  let paginationObject: PaginateResult<any> = {
    docs: arrayToPaginate.slice((page - 1) * limit, page * limit), // Using Array.slice() to paginate feelings.
    totalDocs: arrayToPaginate.length,
    limit: limit,
    totalPages: Math.ceil(arrayToPaginate.length / limit),
    page: page,
    pagingCounter: (page - 1) * limit + 1,
    hasPrevPage: true,
    hasNextPage: true,
    prevPage: page - 1,
    nextPage: page + 1,
    offset: 1,
  };
  if (page + 1 > paginationObject.totalPages) {
    paginationObject.hasNextPage = false;
    paginationObject.nextPage = null;
  }
  if (page - 1 < 1 || page > paginationObject.totalPages + 1) {
    paginationObject.hasPrevPage = false;
    paginationObject.prevPage = null;
  }
  return paginationObject;
};

export const removeEmptyProperties = (obj: any): object =>
  Object.keys(obj)
    .filter((k) => obj[k] != null)
    .reduce((a, k) => ({ ...a, [k]: obj[k] }), {});
