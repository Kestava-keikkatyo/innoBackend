const User = require("../models/User")

/**
 * Checks if a worker with param id exists.
 * @param {*} id
 * @returns True, if worker exists. False, if not.
*/
const workerExists = (id, next) => {
  try {
    return User.findById({ _id: id }, (error, result) => {
      if (error || !result) {
        return
      } else {
        return result
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

module.exports = {
  workerExists, whichWorkersExist
}
