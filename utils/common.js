const User = require("../models/User")
const Business = require("../models/Business")
const logger = require("../utils/logger")
const { db } = require("../models/Business")
const Agency = require("../models/Agency")
const BusinessContract = require("../models/BusinessContract")
/**
 * Checks if a worker with param id exists.
 * @param {*} id
 * @returns True, if worker exists. False, if not.
*/
const workerExists = (id, next, callback) => {
  try {
    return User.findById({ _id: id }, (error, result) => {
      if (error || !result) {
        callback(false)
      } else {
        callback(result)
      }
    })
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks through an array of worker ids,and returns an array of ids that exist.
 * Returned list may contain duplicates, if the param array had them.
 * @param {Array} workerIdArray
 */
const whichWorkersExist = (workerIdArray, next, callback) => {
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
    next(exception)
  }
}

/**
 * Checks if the given worker is in a business/work contract in the given array.
 * Gives all matching contracts to callback
 * @param {BusinessContract||WorkContract} contractType
 * @param {Array} contracts
 * @param {*} workerId
 */
const workerExistsInContracts = (contractType, contracts, workerId, next, callback) => {
  try {
    let counter = 0
    let contractsArray = []
    contracts.forEach((contractId, index, array) => {
      contractType.findById(contractId, (error, result) => {
        if (result && !error) {
          contractsArray.push(result)
        }
        counter++
        if (counter === array.length) {
          callback(contractsArray)
        }
      })
    })
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if a business with param id exists.
 * @param {*} id
 * @returns True, if worker exists. False, if not.
*/
const businessExists = (id, next, callback) => {
  try {
    return Business.findById({ _id: id }, (error, result) => {
      if (error || !result) {
        callback(false)
      } else {
        callback(result)
      }
    })
  } catch (exception) {
    next(exception)
  }
}
/**
 * TODO:this function is depended on workcontracts.js post call.
 */
const deleteTracesOfFailedWorkContract = (workerId, businessId, agencyId, contractToCreateid, next) => {
  try {
    //if business
    Business.update(
      { _id: businessId },
      { $pull: { "workContracts" : { _id: contractToCreateid } } },
      false,
      true
    );
    Business.deleteOne(
      { _id: businessId},
      { $pull: { "workContracts" : { _id: contractToCreateid } } },
      false,
      true
    );
    //if agency
    Agency.update(
      { _id: agencyId },
      { $pull: { "workContracts" : { _id: contractToCreateid } } },
      false,
      true
    );
    //if user
    User.update(
      { _id: workerId },
      { $pull: { "workContracts" : { _id: contractToCreateid } } },
      false,
      true
    );
  } catch (exception) {
    next(exception)
  }
}

/**
 * TODO:this function is depended on businesscontract.js post call.
 * Needs to delete contract that is given to this function as a parameter.
 */
const deleteTracesOfBusinessContract = async (contract,next,callback) => {
  try {
    //check which businesscontract is in question 
    if (contract.contractType.toString() == "Worker") 
    {
      await User.findByIdAndUpdate(
        contract.user._id,
        { $pull: { businessContracts : { $in: [contract._id.toString()] } } },
        { multi: false },
        (error,result) => {
          if (error || !result) {
            return callback({success:false,errormsg:"Could not find and update User with ID"})
          } 
        }
      )
    } 
    else if (contract.contractType.toString() == "Business") 
    {
      await Business.findByIdAndUpdate(
        contract.business._id,
        { $pull: { businessContracts :  { $in : [contract._id.toString()] } } },
        { multi: false },
        (error,result) => {
          if (error || !result) {
            return callback({success:false,errormsg:"Could not find and update Business with ID"})
          }
        }
      )
    }
    else {
      callback({success:false,errormsg:"ContractType not worker or business"})
    }
    await Agency.findByIdAndUpdate(
        contract.agency._id,
        { $pull: { businessContracts :  { $in : [contract._id.toString()] } } },
        { multi: false },
        (error,result) => {
          if (error || !result) {
            return callback({success:false,errormsg:"Could not find and update Agency with ID"})
          } else {
            return callback({success:true})
          }
        }
    )
  } catch (exception) {
    next(exception)
  }
}

module.exports = {
  workerExists, whichWorkersExist, businessExists, deleteTracesOfFailedWorkContract, workerExistsInContracts, deleteTracesOfBusinessContract
}
