/** Contains all callback functions that use callback.
 * @module utils/common
 * @requires User
 * @requires Business
 * @requires Agency
 */
import User from "../models/User"
import Business from "../models/Business"
import Agency from "../models/Agency"

import { error as _error } from "../utils/logger"
/**
 * Checks if a worker with param id exists.
 * @param {string} id
 * @param {Function} callback
 * @returns Worker Object, if worker exists. False, if not.
*/
export const workerExists = (id:String, callback:Function) => {
  try {
    return User.findById({ _id: id }, (error:Error, result:any) => {
      if (error || !result) {
        callback(false)
      } else {
        callback(result)
      }
    })
  } catch (exception) {
    _error(exception)
    callback(false)
    return
  }
}

/**
 * Checks through an array of worker ids,and returns an array of ids that exist.
 * Returned list may contain duplicates, if the param array had them.
 * @param {Array} workerIdArray
 * @param {Function} callback
 * @returns {JSON} {existingWorkerIds: existingWorkerIds, nonExistingWorkerIds: nonExistingWorkerIds}
 */
export const whichWorkersExist = (workerIdArray,callback) => {
  try {
    let existingWorkerIds = []
    let nonExistingWorkerIds = []
    if (Array.isArray(workerIdArray)) {
      for (let i = 0; i < workerIdArray.length; i++) {
        User.findById(workerIdArray[i], (error, result) => {
          if (error || !result) {
            nonExistingWorkerIds.push(workerIdArray[i])
          } else {
            existingWorkerIds.push(workerIdArray[i])
          }

          if (i === workerIdArray.length-1) {
            callback({
              existingWorkerIds: existingWorkerIds,
              nonExistingWorkerIds: nonExistingWorkerIds
            })
          }
        })
      }
    }
  } catch (exception) {
    callback(exception)
  }
}

/**
 * Checks if the given worker is in a business/work contract in the given array.
 * Gives all matching contracts to callback
 * @param {BusinessContract|WorkContract} contractType
 * @param {Array} contracts
 * @param {string} workerId
 * @param {Function} callback
 * @returns {Array} contractsArray
 */
export const workerExistsInContracts = (contractType, contracts, workerId,callback) => {
  try {
    contractType.find({ _id: { $in: contracts } }, (error:Error, result:any) => {
      if (error) {
        _error(`error message: ${error.message}\n${error}`)
      }
      callback(result)
    })
  } catch (exception) {
    callback(exception)
  }
}

/**
 * Checks if a business with param id exists.
 * @param {String} id
 * @param {Function} callback
 * @returns {IBusiness|Boolean} Business Object, if worker exists. False, if not.
*/
export const businessExists = (id:String,callback:Function): any => {
  try {
    return Business.findById({ _id: id }, (error:Error, result:any) => {
      if (error || !result) {
        callback(false)
      } else {
        callback(result)
      }
    })
  } catch (exception) {
    callback(exception)
    return
  }
}
/**
 * Deletes traces of failed WorkContract from business, agency and user collection.
 * If you don't wanna delete some references you can leave id value ass null.
 * This function is used in workcontract.js in POST workcontract route.
 * @param {string} workerId User/Workers Id - used to find right worker / can be null
 * @param {string} businessId Business Id - used to find right business / can be null
 * @param {string} agencyId Agency ObjecId - used to find right agency / can be null
 * @param {string} contractToCreateid ContractId - contract that failed save to db
 * @param {Function} callback
 * @returns {Boolean} {workerTraceRemoved,businessTraceRemoved,agencyTraceRemoved}
 */
export const deleteTracesOfFailedWorkContract = async (workerId, businessId, agencyId, contractToCreateid,callback) => {
  try { //Needs somekind of check
    let workerTraceRemoved = undefined
    let businessTraceRemoved = undefined
    let agencyTraceRemoved = undefined
    //if business
    if (businessId !== null) {
      await Business.findByIdAndUpdate(
        { _id: businessId },
        { $pull: { workContracts : { $in: [contractToCreateid.toString()] } } },
        { multi: false },
        (err,result) => {
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
        (err,result) => {
          if (err || !result) {
            agencyTraceRemoved = false
          } else {
            agencyTraceRemoved = true
          }
        }
      )
    }
    //if user
    if (workerId !== null) {
      await User.findByIdAndUpdate(
        { _id: workerId },
        { $pull: { workContracts : { $in: [contractToCreateid.toString()] } } },
        { multi: false },
        (err,result) => {
          if (err || !result) {
            workerTraceRemoved = false
          } else {
            workerTraceRemoved = true
          }
        }
      )
    }
    return callback({ workerTraceRemoved,businessTraceRemoved,agencyTraceRemoved })
  } catch (exception) {
    callback(exception)
  }
}

/**
 * Deletes leftover traces in agencys businessContracts array list
 * @param {string} agencyid AgencyId - used to findAndUpdate Agency
 * @param {string} contractid BusinessContractId - used to pull correct from Agency
 * @param {Function} callback
 * @return {Boolean} request.success = true/false
 */
export const deleteAgencyTracesOfBusinessContract = async (agencyid,contractid,callback) => {
  try {
    await Agency.findByIdAndUpdate(
      agencyid,
      { $pull: { businessContracts :  { $in : [contractid.toString()] } } },
      { multi: false },
      (error,result) => {
        if (error || !result) {
          return callback( { success:false,errormsg:"Could not find and update Agency with ID" } )
        } else {
          return callback( { success:true } )
        }
      }
    )
  } catch (exception) {
    callback(exception)
  }
}

/**
 * Deletes traces of business contract. Used businesscontract.delete route is used.
 * If trace is deleted adds boolean true to variable.
 * One of the returned values workerTraceRemoved or businessTraceRemoved is undefined.
 * @param {BusinessContract} contract
 * @param {Function} callback
 * @returns {Boolean} workerTraceRemoved, boolean businessTraceRemoved, boolean agencyTraceRemoved
 */
export const deleteTracesOfBusinessContract = async (contract,callback) => {
  try {
    let workerTraceRemoved = undefined
    let businessTraceRemoved = undefined
    //check which businesscontract is in question
    if (contract.contractType.toString() === "Worker")
    {
      await User.findByIdAndUpdate(
        contract.user._id,
        { $pull: { businessContracts : { $in: [contract._id.toString()] } } },
        { multi: false },
        (error,result) => {
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
        (error,result) => {
          if (error || !result) {
            businessTraceRemoved = false
          } else {
            businessTraceRemoved = true
          }
        }
      )
    }
    else {
      callback( { success:false,errormsg:"ContractType not worker or business" } )
    }
    await Agency.findByIdAndUpdate(
      contract.agency._id,
      { $pull: { businessContracts :  { $in : [contract._id.toString()] } } },
      { multi: false },
      (error,result) => {
        if (error || !result) {
          return callback( { workerTraceRemoved,businessTraceRemoved,agencyTraceRemoved:false,errormsg:"Could not find and update Agency with ID" } )
        } else {
          return callback( { workerTraceRemoved,businessTraceRemoved,agencyTraceRemoved:true } )
        }
      }
    )
  } catch (exception) {
    callback(exception)
  }
}
