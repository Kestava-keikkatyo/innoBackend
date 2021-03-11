/** Contains all middleware functions that are used in routes.
 * @module utils/middleware
 * @requires logger
 * @requires User
 * @requires Business
 * @requires Agency
 * @requires BusinessContract
 * @requires WorkContract
 * @requires utils/common
 */
const logger = require("./logger")
const Business = require("../models/Business")
const Agency = require("../models/Agency")
const User = require("../models/User")
const BusinessContract = require("../models/BusinessContract")
const WorkContract = require("../models/WorkContract")
const  { deleteAgencyTracesOfBusinessContract } = require("../utils/common")

const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method)
  logger.info("Path:  ", request.path)
  logger.info("Body:  ", request.body)
  logger.info("---")
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === "CastError" && error.kind === "ObjectId") {
    return response.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

/**
 * Checks if a Business with request.body.businessId exists.
 * @param {ObjectId} request.body.businessId - BusinessId from body.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { error: "No business found with the request businessId." }
 * @throws {JSON} Status 400 - response.body: { error: "No businessId in request body." }
 * @returns {next} next()
 */
const bodyBusinessExists = (request, response, next) => {
  try {
    if (request.body.businessId) {
      return Business.findById({ _id: request.body.businessId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No business found with the request businessId." })
        } else {
          return next()
        }
      })
    } else {
      response.status(400).send({ error: "No businessId in request body." })
    }
  } catch (exception) {
    next(exception)
  }
}
/**
 * Checks if a Worker with request.body.workerId exists.
 * @param {ObjectId} request.body.workerId - WorkerId from body.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { error: "No worker found with the request workerId." }
 * @throws {JSON} Status 400 - response.body: { error: "No workerId in request body." }
 * @returns {next} next()
*/
const bodyWorkerExists = (request, response, next) => {
  try {
    if (request.body.workerId) {
      return User.findById({ _id: request.body.workerId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          return next()
        }
      })
    } else {
      response.status(400).send({ error: "No workerId in request body." })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if a Business with request.body.businessId or Worker with request.body.workerId exists.
 * IF Worker exists populate Worker Object to request.worker and populates request.contractType with "Worker" String.
 * IF Business exists populate Business Object to request.business and populates request.contractType with "Business" String.
 * @param {ObjectId} request.body.workerId - WorkerId from body.
 * @param {ObjectId} request.body.businessId - BusinessId from body.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { error: "No worker found with the request workerId." }
 * @throws {JSON} Status 404 - response.body: { error: "No business found with the request businessId." }
 * @throws {JSON} Status 404 - response.body: { error: "Body doesn't include workerId or businessId" }
 * @returns {next} next()
*/
const bodyWorkerOrBusinessExists = (request, response, next) => {
  try {
    if (request.body.workerId && !request.body.businessId) {
      return User.findById({ _id: request.body.workerId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          request.worker = result
          request.contractType = "Worker"
          return next()
        }
      })
    } else if (!request.body.workerId && request.body.businessId) {
      return Business.findById({ _id: request.body.businessId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No business found with the request businessId." })
        } else {
          request.business = result
          request.contractType = "Business"
          return next()
        }
      })
    } else {
      response.status(404).send({ error: "Body doesn't include workerId or businessId" })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if an Agency with url param :agencyId exists.
 * Returned Agency object from database is populated to request.agency.
 * @param {ObjectId} request.params.agencyId - AgencyId from parameter (url).
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { error: "No Agency found with the request :agencyId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :agencyId in url." }
 * @returns {next} next()
*/
const agencyExists = (request, response, next) => {
  try {
    if (request.params.agencyId) {
      return Agency.findById({ _id: request.params.agencyId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No Agency found with the request :agencyId." })
        } else {
          request.agency = result
          return next()
        }
      })
    } else {
      response.status(400).send({ error: "No :agencyId in url." })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if an Business with url param :businessId exists.
 * Returned Business object from database is populated to request.business.
 * @param {ObjectId} request.param.businessId - BusinessId from parameter (url).
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { error: "No Business found with the request :businessId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :businessId in url." }
 * @returns {next} next()
*/
const businessExists = (request, response, next) => {
  try {
    if (request.params.businessId) {
      return Business.findById({ _id: request.params.businessId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No Business found with the request :businessId." })
        } else {
          request.business = result
          return next()
        }
      })
    } else {
      response.status(400).send({ error: "No :businessId in url." })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if a BusinessContract with url param :businessContractId exists.
 * BusinessContract object from database is populated to request.businessContract.
 * @param {ObjectId} request.params.businessContractId - BusinessContractId from parameter (url).
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - request.body: { error: "No BusinessContract found with the request :businessContractId." }
 * @throws {JSON} Status 400 - request.body: { error: "No :businessContractId in url." }
 * @returns {next} next()
*/
const businessContractExists = (request, response, next) => {
  try {
    if (request.params.businessContractId) {
      return BusinessContract.findById({ _id: request.params.businessContractId }, (error, result) => {
        if (error || !result) {
          response.status(404).send({ error: "No BusinessContract found with the request :businessContractId." })
        } else {
          request.businessContract = result
          return next()
        }
      })
    } else {
      response.status(400).send({ error: "No :businessContractId in url." })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if BusinessContract includes user that is trying to get it.
 * Saves to request.userInBusinessContract true if user is in contract and false if not.
 * @param {BusinessContract} request.businessContract - BusinessContract.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @returns {next} next()
 */
const businessContractIncludesUser = (request,response,next) => {
  try {
    if (request.businessContract !== undefined) {
      if (request.businessContract.agency._id.toString() === response.locals.decoded.id.toString()) {
        request.userInBusinessContract = true
      } else {
        switch (request.businessContract.user) {
        case undefined:
          if (request.businessContract.business._id.toString() === response.locals.decoded.id.toString()) {
            request.userInBusinessContract = true
          }
          break
        default:
          if (request.businessContract.user._id.toString() === response.locals.decoded.id.toString()) {
            request.userInBusinessContract = true
          }
          break
        }
      }
      return next()
    } else {
      request.userInBusinessContract = false
      return next()
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if a WorkContract with url param :contractId exists.
 * Saves found WorkContract to request.workContract if workContract exists.
 * @param {ObjectId} request.params.contractId - ContractId from parameters (url).
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { error: "No WorkContract found with the request :contractId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :contractId in url." }
*/
const workContractExists = (request,response, next) => {
  try {
    if (request.params.contractId) {
      return WorkContract.findById({ _id: request.params.contractId }, (error,result) => {
        if (error || !result) {
          response.status(404).send({ error: "No WorkContract found with the request :contractId." })
        } else {
          request.workContract = result
          return next()
        }
      })
    } else {
      response.status(400).send({ error: "No :contractId in url." })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if user who is using route is in workcontract.
 * For this to work token must be authenticated with authenticateToken function and workContract must exist use workContractExists function.
 * Saves to request.userInWorkContract true if workContract includes user.
 * @param {WorkContract} request.workContract - WorkContract
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @returns {next} next()
 */
const workContractIncludesUser = (request, response, next) => {
  try {
    if (request.workContract !== undefined) {
      if (request.workContract.user._id.toString() === response.locals.decoded.id.toString()) {
        request.userInWorkContract = true
      }
      else if (request.workContract.business._id.toString() === response.locals.decoded.id.toString()) {
        request.userInWorkContract = true
      }
      else if (request.workContract.agency._id.toString() === response.locals.decoded.id.toString()) {
        request.userInWorkContract = true
      }
      else {
        request.userInWorkContract = false
      }
      return next()
    } else {
      request.userInWorkContract = false
      return next()
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if the logged in user is an Agency.
 * Agency object from database is populated to request.agency
 * @param {ObjectId} response.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 404 - response.body: { message: "This route is only available to Agency users." }
 * @returns {next} next()
*/
const needsToBeAgency = (request, response, next) => {
  Agency.findById({ _id: response.locals.decoded.id }, (error, result) => {
    if (error || !result) {
      response.status(401).send(error || { message: "This route is only available to Agency users." })
    } else {
      request.agency = result
      return next()
    }
  })
}

/**
 * Checks if the logged in user is a Business.
 * Business object from database is populated to request.business
 * @param {ObjectId} request.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 401 - response.body: { message: "This route only available to Business users." }
 * @returns {next} next()
*/
const needsToBeBusiness = (request, response, next) => {
  Business.findById({ _id: response.locals.decoded.id }, (error, result) => {
    if (error || !result) {
      response.status(401).send(error || { message: "This route only available to Business users." })
    } else {
      request.business = result
      return next()
    }
  })
}

/**
 * Checks if the logged in user is a Worker.
 * Worker object from database is populated to request.worker.
 * @param {ObjectId} request.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 401 - response.body: { message: "This route only available to Worker users." }
 * @returns {next} next()
*/
const needsToBeWorker = (request, response, next) => {
  User.findById({ _id: response.locals.decoded.id }, (error, result) => {
    if (error || !result) {
      response.status(401).send(error || { message: "This route only available to Worker users." })
    } else {
      request.worker = result
      return next()
    }
  })
}

/**
 * Checks if the logged in user is a Agency or Business
 * If user is business, Business object from database is populated to request.business.
 * if not user is agency, Agency object from database is populated to request.agency.
 * @param {ObjectId} response.locals.decoded.id - UsersId (AgencyId or BusinessId) from token.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency or Business users." }
 * @throws {JSON} Status 401 - response.body: { error }
 * @returns {next} next()
 */
const needsToBeAgencyOrBusiness = (request, response, next) => {
  Agency.findById( { _id: response.locals.decoded.id }, (error, result) => {
    if (!error) {
      if (!result) {
        Business.findById({ _id: response.locals.decoded.id }, (error, result) => {
          if (error || !result) {
            response.status(401).send(error || { message: "This route is only available to Agency or Business users." })
          } else {
            request.business = result
            return next()
          }
        })
      } else {
        request.agency = result
        return next()
      }
    } else {
      response.status(401).send(error)
      return next()
    }
  })
}

/**
 * Checks if the logged in user is Business or Worker
 * If user is worker, Worker object from database is populated to request.worker.
 * If not user is business, Business object from database is populated to request.business
 * @param {ObjectId} response.locals.decoded.id - UsersId (BusinessId or WorkerId) from token.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Business or Worker users" }
 * @throws {JSON} Status 401 - response.body: { error }
 * @returns {next} next()
 */
const needsToBeBusinessOrWorker = (request, response, next) => {
  Business.findById( { _id: response.locals.decoded.id }, (error, result) => {
    if (!error) {
      if (!result) {
        User.findById( { _id: response.locals.decoded.id }, (error, result) => {
          if (error || !result) {
            response.status(401).send( error || { message: "This route is only available to Business or Worker users" })
          } else {
            request.worker = result
            return next()
          }
        })
      } else {
        request.business = result
        return next()
      }
    } else {
      response.status(401).send(error)
      return next()
    }
  })
}

/**
 * Checks if the logged in user is Agency, Business or Worker.
 * If user is worker, Worker object from database is populated to request.worker.
 * If user is business, Business object from database is populated to request.business.
 * If user is agency, Agency object from database is populated to request.agency.
 * @param {ObjectId} response.locals.decoded.id - UserId (AgencyId or BusinessId) from token.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency, Business or Worker users." }
 * @returns {next} next()
 */
const needsToBeAgencyBusinessOrWorker = (request,response, next) => {
  Agency.findById({ _id:response.locals.decoded.id }, (error,result) => {
    if (!error) {
      if (!result) {
        Business.findById({ _id: response.locals.decoded.id }, (error, result) => {
          if (!error) {
            if (!result) {
              User.findById({ _id: response.locals.decoded.id }, (error, result) => {
                if (error || !result) {
                  response.status(401).send(error || { message: "This route is only available to Agency, Business or Worker users." })
                } else {
                  request.worker = result
                  return next()
                }
              })
            } else {
              request.business = result
              return next()
            }
          }
        })
      } else {
        request.agency = result
        return next()
      }
    } else {
      response.status(401).send(error)
      return next()
    }
  } )
}
/**
 * Used to go through agency businessContracts and check if correct Business and Worker are found.
 * Saves to request.commonContractIndex value, if value is 1 both Business And Worker have BusinessContract with agency.
 * @param {Array} request.agency.businessContracts - Agency array of businessContract ID:s.
 * @param {request} request
 * @param {response} response
 * @param {next} next
 * @returns {next} next()
 */
const checkAgencyBusinessContracts = async (request,response,next) => {
  try {
    request.commonContractIndex = -1
    if (request.agency.businessContracts || request.agency.businessContracts.length > 0) {
      await Promise.all(request.agency.businessContracts.map(async (element) => {
        await BusinessContract.findById(element._id,{ business:1,user:1,contractMade:1  },  async (err, contract) => {
          if (err) {
            request.commonContractIndex = -1
          } else {
            console.log("Element:", element)
            if (!contract) {
              await deleteAgencyTracesOfBusinessContract(request.body.agencyId,element,next, (result) => {
                if (!result.success) {
                  logger.error("Contract link could not be deleted")
                } else {
                  logger.info("Contract link deleted")
                }
              })
            } else {
              console.log("Result:", contract)
              switch (contract.business) {
              case undefined:
                if (contract.user._id.toString() === request.body.workerId.toString() && contract.contractMade === true) {
                  request.commonContractIndex += 1
                }
                break
              default:
                if (contract.business._id.toString() === request.body.businessId.toString() && contract.contractMade === true) {
                  request.commonContractIndex += 1
                }
                break
              }
            }
          }
        })
      }))
      return next()
    } else {
      return next()
    }
  } catch (exception) {
    next(exception)
  }
}
module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  bodyBusinessExists,
  bodyWorkerExists,
  bodyWorkerOrBusinessExists,
  businessExists,
  agencyExists,
  businessContractExists,
  businessContractIncludesUser,
  workContractExists,
  workContractIncludesUser,
  needsToBeAgency,
  needsToBeBusiness,
  needsToBeWorker,
  needsToBeAgencyOrBusiness,
  needsToBeBusinessOrWorker,
  needsToBeAgencyBusinessOrWorker,
  checkAgencyBusinessContracts
}