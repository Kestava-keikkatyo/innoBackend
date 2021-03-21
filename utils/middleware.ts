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
import { Request , Response } from "express"
import {error as _error} from "./logger"
import Business from "../models/Business"
import Agency from "../models/Agency"
import User from "../models/User"
import BusinessContract, { IBusinessContract } from "../models/BusinessContract"
import WorkContract from "../models/WorkContract"
import { deleteAgencyTracesOfBusinessContract } from "../utils/common"
import { CallbackError } from "mongoose"

export const requestLogger = (req:Request, _res:Response, next:Function) => {
  logger.info("Method:", req.method)
  logger.info("Path:  ", req.path)
  logger.info("Body:  ", req.body)
  logger.info("---")
  next()
}

export const unknownEndpoint = (_req:Request, res:Response) => {
  res.status(404).send({ error: "unknown endpoint" })
}

export const errorHandler = (err:any, _req:Request, res:Response, next:Function) => {
  logger.error(err.message)

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).send({ error: "malformatted id" })
  } else if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message })
  }
  return next(err)
}

/**
 * Checks if a Business with request.body.businessId exists.
 * @param {String} req.body.businessId - BusinessId from body.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No business found with the request businessId." }
 * @throws {JSON} Status 400 - response.body: { error: "No businessId in request body." }
 * @returns {Function} next()
 */
export const bodyBusinessExists = (req: Request, res: Response, next: Function): any => {
  try {
    if (req.body.businessId) {
      return Business.findById({ _id: req.body.businessId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No business found with the request businessId." })
        } else {
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No businessId in request body." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * Checks if a Worker with request.body.workerId exists.
 * @param {String} req.body.workerId - WorkerId from body.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No worker found with the request workerId." }
 * @throws {JSON} Status 400 - response.body: { error: "No workerId in request body." }
 * @returns {Function} next()
*/
export const bodyWorkerExists = (req:Request, res:Response, next:Function) => {
  try {
    if (req.body.workerId) {
      return User.findById({ _id: req.body.workerId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No workerId in request body." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if a Business with request.body.businessId or Worker with request.body.workerId exists.
 * IF Worker exists populate Worker Object to request.body.worker and populates request.body.contractType with "Worker" String.
 * IF Business exists populate Business Object to request.body.business and populates request.body.contractType with "Business" String.
 * @param {String} req.body.workerId - WorkerId from body.
 * @param {String} req.body.businessId - BusinessId from body.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No worker found with the request workerId." }
 * @throws {JSON} Status 404 - response.body: { error: "No business found with the request businessId." }
 * @throws {JSON} Status 404 - response.body: { error: "Body doesn't include workerId or businessId" }
 * @returns {Function} next()
*/
export const bodyWorkerOrBusinessExists = (req:Request, res:Response, next:Function) => {
  try {
    if (req.body.workerId && !req.body.businessId) {
      return User.findById({ _id: req.body.workerId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          req.body.worker = result
          req.body.contractType = "Worker"
          return next()
        }
      })
    } else if (!req.body.workerId && req.body.businessId) {
      return Business.findById({ _id: req.body.businessId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No business found with the request businessId." })
        } else {
          req.body.business = result
          req.body.contractType = "Business"
          return next()
        }
      })
    } else {
      return res.status(404).send({ error: "Body doesn't include workerId or businessId" })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if an Agency with url param :agencyId exists.
 * Returned Agency object from database is populated to request.body.agency.
 * @param {String} req.params.agencyId - AgencyId from parameter (url).
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No Agency found with the request :agencyId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :agencyId in url." }
 * @returns {Function} next()
*/
export const agencyExists = (req:Request, res:Response, next:Function) => {
  try {
    if (req.params.agencyId) {
      return Agency.findById({ _id: req.params.agencyId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No Agency found with the request :agencyId." })
        } else {
          req.body.agency = result
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No :agencyId in url." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if an Business with url param :businessId exists.
 * Returned Business object from database is populated to request.body.business.
 * @param {String} req.param.businessId - BusinessId from parameter (url).
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No Business found with the request :businessId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :businessId in url." }
 * @returns {Function} next()
*/
export const businessExists = (req:Request, res:Response, next:Function) => {
  try {
    if (req.params.businessId) {
      return Business.findById({ _id: req.params.businessId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No Business found with the request :businessId." })
        } else {
          req.body.business = result
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No :businessId in url." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if a BusinessContract with url param :businessContractId exists.
 * BusinessContract object from database is populated to request.body.businessContract.
 * @param {String} req.params.businessContractId - BusinessContractId from parameter (url).
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - request.body: { error: "No BusinessContract found with the request :businessContractId." }
 * @throws {JSON} Status 400 - request.body: { error: "No :businessContractId in url." }
 * @returns {Function} next()
*/
export const businessContractExists = (req:Request, res:Response, next:Function) => {
  try {
    if (req.params.businessContractId) {
      return BusinessContract.findById({ _id: req.params.businessContractId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No BusinessContract found with the request :businessContractId." })
        } else {
          req.body.businessContract = result
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No :businessContractId in url." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if BusinessContract includes user that is trying to get it.
 * Saves to request.body.userInBusinessContract true if user is in contract and false if not.
 * @param {BusinessContract} req.body.businessContract - BusinessContract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
 */
export const businessContractIncludesUser = (req:Request,res:Response,next:Function) => {
  try {
    if (req.body.businessContract !== undefined) {
      if (req.body.businessContract.agency._id.toString() === res.locals.decoded.id.toString()) {
        req.body.userInBusinessContract = true
      } else {
        switch (req.body.businessContract.user) {
        case undefined:
          if (req.body.businessContract.business._id.toString() === res.locals.decoded.id.toString()) {
            req.body.userInBusinessContract = true
          }
          break
        default:
          if (req.body.businessContract.user._id.toString() === res.locals.decoded.id.toString()) {
            req.body.userInBusinessContract = true
          }
          break
        }
      }
    } else {
      req.body.userInBusinessContract = false
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if a WorkContract with url param :contractId exists.
 * Saves found WorkContract to request.body.workContract if workContract exists.
 * @param {String} req.params.contractId - ContractId from parameters (url).
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No WorkContract found with the request :contractId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :contractId in url." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
*/
export const workContractExists = (req:Request,res:Response, next:Function) => {
  try {
    if (req.params.contractId) {
      return WorkContract.findById({ _id: req.params.contractId }, (err:Error,result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No WorkContract found with the request :contractId." })
        } else {
          req.body.workContract = result
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No :contractId in url." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if user who is using route is in workcontract.
 * For this to work token must be authenticated with authenticateToken function and workContract must exist use workContractExists function.
 * Saves to request.body.userInWorkContract true if workContract includes user.
 * @param {WorkContract} req.body.workContract - WorkContract
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
 */
export const workContractIncludesUser = (req:Request, res:Response, next:Function) => {
  try {
    if (req.body.workContract !== undefined) {
      if (req.body.workContract.user._id.toString() === res.locals.decoded.id.toString()) {
        req.body.userInWorkContract = true
      }
      else if (req.body.workContract.business._id.toString() === res.locals.decoded.id.toString()) {
        req.body.userInWorkContract = true
      }
      else if (req.body.workContract.agency._id.toString() === res.locals.decoded.id.toString()) {
        req.body.userInWorkContract = true
      }
      else {
        req.body.userInWorkContract = false
      }
    } else {
      req.body.userInWorkContract = false
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if the logged in user is an Agency.
 * Agency object from database is populated to request.body.agency
 * @param {String} res.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { message: "This route is only available to Agency users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
*/
export const needsToBeAgency = (req:Request, res:Response, next:Function) => {
  try {
    return Agency.findById({ _id: res.locals.decoded.id }, (err:Error, result:any) => {
      if (err || !result) {
        return res.status(401).send(err || { message: "This route is only available to Agency users." })
      } else {
        req.body.agency = result
        return next()
      }
    })
  } catch (error) {
    return res.status(500).send({ error })
  }
}

/**
 * Checks if the logged in user is a Business.
 * Business object from database is populated to request.body.business
 * @param {String} request.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route only available to Business users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
*/
export const needsToBeBusiness = (req:Request, res:Response, next:Function) => {
  try {
    return Business.findById({ _id: res.locals.decoded.id }, (err:Error, result:any) => {
      if (err || !result) {
        return res.status(401).send(err || { message: "This route only available to Business users." })
      } else {
        req.body.business = result
        return next()
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if the logged in user is a Worker.
 * Worker object from database is populated to request.body.worker.
 * @param {String} req.locals.decoded.id - UsersId (AgencyId) from token. // TODO response.locals...
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route only available to Worker users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
*/
export const needsToBeWorker = (req:Request, res:Response, next:Function) => {
  try {
    return User.findById({ _id: res.locals.decoded.id }, (err:Error, result:any) => {
      if (err || !result) {
        return res.status(401).send(err || { message: "This route only available to Worker users." })
      } else {
        req.body.worker = result
        return next()
      }
    })
  } catch (error) {
    return res.status(500).send({ error })
  }
}

/**
 * Checks if the logged in user is a Agency or Business
 * If user is business, Business object from database is populated to request.business.
 * if not user is agency, Agency object from database is populated to request.agency.
 * @param {String} res.locals.decoded.id - UsersId (AgencyId or BusinessId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency or Business users." }
 * @throws {JSON} Status 401 - response.body: { error }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
 */
export const needsToBeAgencyOrBusiness = (req:Request, res:Response, next:Function) => {
  try {
    return Agency.findById( { _id: res.locals.decoded.id }, (err:Error, result:any) => {
      if (!err) {
        if (!result) {
          Business.findById({ _id: res.locals.decoded.id }, (err:Error, result:any) => {
            if (err || !result) {
              res.status(401).send(err || { message: "This route is only available to Agency or Business users." })
            } else {
              req.body.business = result
              return next()
            }
          })
        } else {
          req.body.agency = result
          return next()
        }
      } else {
        return res.status(401).send(err)
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if the logged in user is Business or Worker
 * If user is worker, Worker object from database is populated to request.worker.
 * If not user is business, Business object from database is populated to request.business
 * @param {String} res.locals.decoded.id - UsersId (BusinessId or WorkerId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Business or Worker users" }
 * @throws {JSON} Status 401 - response.body: { error }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
 */
export const needsToBeBusinessOrWorker = (req:Request, res:Response, next:Function) => {
  try {
    return Business.findById( { _id: res.locals.decoded.id }, (err:Error, result:Response) => {
      if (!err) {
        if (!result) {
          User.findById( { _id: res.locals.decoded.id }, (err:Error, result:Response) => {
            if (err || !result) {
              return res.status(401).send( err || { message: "This route is only available to Business or Worker users" })
            } else {
              req.body.worker = result
              return next()
            }
          })
        } else {
          req.body.business = result
          return next()
        }
      } else {
        return res.status(401).send(err)
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}

/**
 * Checks if the logged in user is Agency, Business or Worker.
 * If user is worker, Worker object from database is populated to request.body.worker.
 * If user is business, Business object from database is populated to request.body.business.
 * If user is agency, Agency object from database is populated to request.body.agency.
 * @param {String} res.locals.decoded.id - UserId (AgencyId or BusinessId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency, Business or Worker users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
 */
export const needsToBeAgencyBusinessOrWorker = (req:Request, res:Response, next:Function) => {
  try {
    return Agency.findById({ _id: res.locals.decoded.id }, (err:Error,result:any) => {
      if (!err) {
        if (!result) {
          Business.findById({ _id: res.locals.decoded.id }, (err:Error, result:any) => {
            if (!err) {
              if (!result) {
                User.findById({ _id: res.locals.decoded.id }, (err:Error, result:any) => {
                  if (err || !result) {
                    return res.status(401).send(err || { message: "This route is only available to Agency, Business or Worker users." })
                  } else {
                    req.body.worker = result
                    return next()
                  }
                })
              } else {
                req.body.business = result
                return next()
              }
            }
          })
        } else {
          req.body.agency = result
          return next()
        }
      } else {
        return res.status(401).send(err)
      }
    } )
  } catch (error) {
    return res.status(500).send({ error })
  }
}
/**
 * Used to go through agency businessContracts and check if correct Business and Worker are found.
 * Saves to request.commonContractIndex value, if value is 1 both Business And Worker have BusinessContract with agency.
 * @param {Array} req.body.agency.businessContracts - Agency array of businessContract ID:s.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {Function} next - NextFunction.
 * @throws {JSON} Status 204 - response.body: { message:"Agency doesn't have any BusinessContracts" }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {Function} next()
 */
export const checkAgencyBusinessContracts = async (req:Request,res:Response,next:Function) => {
  try {
    req.body.commonContractIndex = -1
    if (req.body.agency.businessContracts || req.body.agency.businessContracts.length > 0) {
      await Promise.all(req.body.agency.businessContracts.map(async (element:any) => {
        await BusinessContract.findById(element._id,{ business:1,user:1,contractMade:1  },null, async (err:CallbackError, contract:IBusinessContract | null) => {
          if (err) {
            req.body.commonContractIndex = -1
          } else {
            console.log("Element:", element)
            if (!contract) {
              await deleteAgencyTracesOfBusinessContract(req.body.agencyId,element,(result:any) => {
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
                if (contract.user.toString() === req.body.workerId.toString() && contract.contractMade === true) {
                  req.body.commonContractIndex += 1
                }
                break
              default:
                if (contract.business.toString() === req.body.businessId.toString() && contract.contractMade === true) {
                  req.body.commonContractIndex += 1
                }
                break
              }
            }
          }
        })
      }))
      return next()
    } else {
      return res.status(204).send({ message:"Agency doesn't have any BusinessContracts" })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}