const User = require("../models/User")
const Business = require("../models/Business")
const Agency = require("../models/Agency")

/**
 * Checks if a worker with param id exists.
 * @param {ObjectID} id
 * @returns Worker Object, if worker exists. False, if not.
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
 * @param {ObjectId} id
 * @returns Business Object, if worker exists. False, if not.
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
 * Deletes traces of failed WorkContract from business, agency and user collection.
 * If you don't wanna delete some references you can leave id value ass null.
 * This function is used in workcontract.js in POST workcontract route.
 * @param {ObjectId} workerId User/Workers Id - used to find right worker / can be null
 * @param {ObjectId} businessId Business Id - used to find right business / can be null
 * @param {ObjectId} agencyId Agency ObjecId - used to find right agency / can be null
 * @param {ObjectId} contractToCreateid ContractId - contract that failed save to db
 * @returns int filtersRemoved / filtersRemoved is null if no traces were removed
 */
const deleteTracesOfFailedWorkContract = async (workerId, businessId, agencyId, contractToCreateid, next, callback) => {
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
    next(exception)
  }
}

/**
 * Deletes leftover traces in agencys businessContracts array list
 * @param {ObjectId} agencyid AgencyId - used to findAndUpdate Agency
 * @param {ObjectId} contractid BusinessContractId - used to pull correct from Agency
 * @param {*} next
 * @param {*} callback
 * @return request.success = true/false
 */
const deleteAgencyTracesOfBusinessContract = async (agencyid,contractid,next,callback) => {
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
    next(exception)
  }
}

/**
 * Deletes traces of business contract. Used businesscontract.delete route is used.
 * If trace is deleted adds boolean true to variable.
 * One of the returned values workerTraceRemoved or businessTraceRemoved is undefined.
 * @param {Array} contract
 * @param {*} next
 * @param {*} callback
 * @returns boolean workerTraceRemoved, boolean businessTraceRemoved, boolean agencyTraceRemoved
 */
const deleteTracesOfBusinessContract = async (contract,next,callback) => {
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
    next(exception)
  }
}

module.exports = {
  workerExists,
  whichWorkersExist,
  businessExists,
  deleteTracesOfFailedWorkContract,
  workerExistsInContracts,
  deleteAgencyTracesOfBusinessContract,
  deleteTracesOfBusinessContract,
}
