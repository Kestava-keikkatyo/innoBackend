const logger = require("./logger")
const Business = require("../models/Business")
const Agency = require("../models/Agency")
const User = require("../models/User")
const BusinessContract = require("../models/BusinessContract")
const WorkContract = require("../models/WorkContract")

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
 * Checks if an Agency with url param :agencyId exists.
 * Returned Agency object from database is put to request.agency
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
 * Returned Business object from database is put to request.business
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
 *Checks if user who is using route is in workcontract.
 *For this to work token must be authenticated with authenticateToken function and workContract must exist use workContractExists function.
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
*/
const needsToBeBusiness = (request, response, next) => {
  Business.findById({ _id: response.locals.decoded.id }, (error, result) => {
    if (error || !result) {
      response.status(401).send(error || { message: "This route only available to Business users." }) // TODO App crashes if trying to get for example business contracts before logging in (as business)
    } else {
      request.business = result
      return next()
    }
  })
}

/**
 * Checks if the logged in user is a Worker.
 * Business object from database is populated to request.worker
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
    }
  })
}

/**
 * Checks if the logged in user is Business or Worker
 * @param {*} request
 * @param {*} response
 * @param {*} next
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
    }
  })
}

/**
 * Checks if the logged in user is Agency, Business or Worker.
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
                  request.user = result
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
    }
  } )
}
module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  bodyBusinessExists,
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
  needsToBeAgencyBusinessOrWorker
}