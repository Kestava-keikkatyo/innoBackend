/** Contains all callback functions that use callback.
 * @module utils/common
 * @requires Worker
 * @requires Business
 * @requires Agency
 */
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"

import { error as _error } from "../utils/logger"
import {CallbackError, PaginateResult, /*Model,*/ Types} from "mongoose"
import {IAgencyDocument, IBusinessDocument, /*IBusinessContract, IWorkContract,*/ IWorkerDocument} from "../objecttypes/modelTypes";
import {IBaseBody, IContractTracesRemoved, IRemovedTraces} from "../objecttypes/otherTypes";
/**
 * Checks if a worker with param id exists.
 * @param {string} id
 * @param {Function} callback
 * @returns Worker Object if worker exists, null if not.
*/
export const workerExists = (id: string | Types.ObjectId, callback: (result: IWorkerDocument | null) => void): void => {
  try {
    Worker.findById(id, (error: CallbackError, result: IWorkerDocument | null) => {
      if (error || !result) {
        callback(null)
      } else {
        callback(result)
      }
    })
  } catch (exception) {
    _error(exception)
    callback(null)
  }
}

/**
 * Checks through an array of worker ids,and returns an array of ids that exist.
 * Returned list may contain duplicates, if the param array had them.
 * @param {Array} workerIdArray
 * @param {Function} callback
 * @returns {JSON} {existingWorkerIds: existingWorkerIds, nonExistingWorkerIds: nonExistingWorkerIds} // TODO callback?
 */
export const whichWorkersExist = (workerIdArray: Array<string>, callback: (workerResult: any) => void): void => {
  try {
    let existingWorkerIds: string[] = []
    let nonExistingWorkerIds: string[] = []
    for (let i = 0; i < workerIdArray.length; i++) {
      Worker.findById(workerIdArray[i], (err: CallbackError, result: IWorkerDocument | null) => {
        if (err || !result) {
          nonExistingWorkerIds.push(workerIdArray[i])
        } else {
          existingWorkerIds.push(workerIdArray[i])
        }

        if (i === workerIdArray.length-1) { // TODO If for some reason an earlier find took longer to execute, this array could be missing some Ids
          callback({
            existingWorkerIds: existingWorkerIds,
            nonExistingWorkerIds: nonExistingWorkerIds
          })
        }
      })
    }
  } catch (exception) {
    // TODO callback(exception)
  }
}

/**
 * Checks if the given worker is in a business/work contract in the given array.
 * Gives all matching contracts to callback
 * @param {BusinessContract|WorkContract} contractType
 * @param {Array} contracts
 * @param {string} _workerId
 * @param {Function} callback
 * @returns {Array} contractsArray
 */
/*
export const workerExistsInContracts = (contractType: Model<IWorkContract> | Model<IBusinessContract>, contracts: Array<string>, _workerId: string, callback: (contracts: Array<IWorkContract> | Array<IBusinessContract>) => void) => {
  try {
    contractType.find(
        { _id: { $in: contracts } },
        (error: CallbackError, result: Array<IWorkContract> | Array<IBusinessContract>) => {
      if (error) {
        _error(`error message: ${error.message}\n${error}`)
      }
      callback(result)
    })
  } catch (exception) {
    callback(exception)
  }
}
*/
/**
 * Checks if a business with param id exists.
 * @param {String} id
 * @param {Function} callback
 * @returns {IBusinessDocument|null} Business Object if worker exists, null if not.
*/
export const businessExists = (id: string, callback: (result: IBusinessDocument | null) => void): void => {
  try {
    Business.findById({ _id: id }, (error:Error, result:any) => {
      if (error || !result) {
        callback(null)
      } else {
        callback(result)
      }
    })
  } catch (exception) {
    _error(exception)
    callback(null)
  }
}
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
export const deleteTracesOfFailedWorkContract = async (workerId: string | null, businessId: string | null, agencyId: string | null, contractToCreateid: string, callback: (result: IRemovedTraces) => void ): Promise<void> => {
  try { //Needs somekind of check
    let workerTraceRemoved: boolean | undefined
    let businessTraceRemoved: boolean | undefined
    let agencyTraceRemoved: boolean | undefined
    //if business
    if (businessId !== null) {
      await Business.findByIdAndUpdate(
        { _id: businessId },
        { $pull: { workContracts : { $in: [contractToCreateid.toString()] } } },
        { multi: false },
        (err: CallbackError, result: IBusinessDocument | null) => {
          if (err || !result) {
            businessTraceRemoved = false
          } else {
            businessTraceRemoved = true
          }
        }
      )
    }
    //if agency
    if (agencyId !== null) {
      await Agency.findByIdAndUpdate(
        { _id: agencyId },
        { $pull: { workContracts : { $in: [contractToCreateid.toString()] } } },
        { multi: false },
        (err: CallbackError, result: IAgencyDocument | null) => {
          if (err || !result) {
            agencyTraceRemoved = false
          } else {
            agencyTraceRemoved = true
          }
        }
      )
    }
    //if worker
    if (workerId !== null) {
      await Worker.findByIdAndUpdate(
        { _id: workerId },
        { $pull: { workContracts : { $in: [contractToCreateid.toString()] } } },
        { multi: false },
        (err: CallbackError, result: IWorkerDocument | null) => {
          if (err || !result) {
            workerTraceRemoved = false
          } else {
            workerTraceRemoved = true
          }
        }
      )
    }
    return callback({ workerTraceRemoved, businessTraceRemoved, agencyTraceRemoved })
  } catch (exception) {
    callback(exception)
  }
}

/**
 * Deletes leftover traces in agencys businessContracts array list
 * @param {string} agencyId AgencyId - used to findAndUpdate Agency
 * @param {string} contractId BusinessContractId - used to pull correct from Agency
 * @param {Function} callback
 * @return {Boolean} request.success = true/false
 */
export const deleteAgencyTracesOfBusinessContract = async (agencyId: string, contractId: string, callback: (result: IContractTracesRemoved) => void): Promise<void> => {
  try {
    await Agency.findByIdAndUpdate(
      agencyId,
      { $pull: { businessContracts :  { $in : [contractId.toString()] } } },
      { multi: false },
      (error,result) => {
        if (error || !result) {
          callback( { success: false, error: "Could not find and update Agency with ID" } )
        } else {
          callback( { success: true } )
        }
      }
    )
  } catch (exception) {
    callback(exception)
  }
}

/** // TODO @deprecated ?
 * Deletes traces of business contract. Used businesscontract.delete route is used.
 * If trace is deleted adds boolean true to variable.
 * One of the returned values workerTraceRemoved or businessTraceRemoved is undefined.
 * @param {BusinessContract} contract
 * @param {Function} callback
 * @returns {Boolean} workerTraceRemoved, boolean businessTraceRemoved, boolean agencyTraceRemoved
 */
export const deleteTracesOfBusinessContract = async (contract: any, callback: (result: IRemovedTraces) => void): Promise<void> => {
  try {
    let workerTraceRemoved: boolean | undefined = undefined
    let businessTraceRemoved: boolean | undefined = undefined
    //check which businesscontract is in question
    if (contract.contractType.toString() === "Worker")
    {
      await Worker.findByIdAndUpdate(
        contract.worker._id,
        { $pull: { businessContracts : { $in: [contract._id.toString()] } } },
        { multi: false },
        (error: CallbackError, result: IWorkerDocument | null) => {
          if (error || !result) {
            workerTraceRemoved = false
          } else {
            workerTraceRemoved = true
          }
        }
      )
    }
    else if (contract.contractType.toString() === "Business")
    {
      await Business.findByIdAndUpdate(
        contract.business._id,
        { $pull: { businessContracts :  { $in : [contract._id.toString()] } } },
        { multi: false },
        (error: CallbackError, result: IBusinessDocument | null) => {
          if (error || !result) {
            businessTraceRemoved = false
          } else {
            businessTraceRemoved = true
          }
        }
      )
    }
    else {
     // callback( { success: false, error: "ContractType not worker or business" } ) Ei callbackissä voi palauttaa eri asioita miten huvittaa!
    }
    await Agency.findByIdAndUpdate(
      contract.agency._id,
      { $pull: { businessContracts :  { $in : [contract._id.toString()] } } },
      { multi: false },
      (error: CallbackError, result: IAgencyDocument | null) => {
        if (error || !result) {
          return callback( { workerTraceRemoved, businessTraceRemoved, agencyTraceRemoved: false, error: "Could not find and update Agency with ID" } )
        } else {
          return callback( { workerTraceRemoved, businessTraceRemoved, agencyTraceRemoved: true } )
        }
      }
    )
  } catch (exception) {
    callback(exception)
  }
}

/**
 * Function that returns the forms of the agency or business, depending on which is provided in the body.
 * @param body the body of the request
 */
export const getAgencyOrBusinessOwnForms = (body: IBaseBody): Array<Types.ObjectId> | null => {
  try {
    let myForms = null
    if (body.agency) {
      myForms = body.agency.forms as Array<Types.ObjectId>
    } else if (body.business) {
      myForms = body.business.forms as Array<Types.ObjectId>
    }
    return myForms
  } catch (exception) {
    return exception
  }
}

/**
 * Function that paginates an array, and returns it as an object
 * that is identical to what mongoose-paginate-v2 library returns.
 * @param page The page we want
 * @param limit The max number of items in a page
 * @param arrayToPaginate The array we want to paginate
 */
export const buildPaginatedObjectFromArray = (page: number, limit: number, arrayToPaginate: Array<any>): PaginateResult<any> => {
  let paginationObject: PaginateResult<any> = {
    docs: arrayToPaginate.slice((page-1)*limit, page*limit), // Using Array.slice() to paginate feelings.
    totalDocs: arrayToPaginate.length,
    limit: limit,
    totalPages: Math.ceil(arrayToPaginate.length/limit),
    page: page,
    pagingCounter: (page-1)*limit+1,
    hasPrevPage: true,
    hasNextPage: true,
    prevPage: page-1,
    nextPage: page+1
  }
  if (page+1 > paginationObject.totalPages) {
    paginationObject.hasNextPage = false
    paginationObject.nextPage = null
  }
  if (page-1 < 1 || page > paginationObject.totalPages+1) {
    paginationObject.hasPrevPage = false
    paginationObject.prevPage = null
  }
  return paginationObject
}
