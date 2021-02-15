const User = require("../models/User")
const Business = require("../models/Business")
const logger = require("../utils/logger")
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

  } catch (exception) {
    next(exception)
  }
}

module.exports = {
  workerExists, whichWorkersExist, businessExists, deleteTracesOfFailedWorkContract, workerExistsInContracts
}
