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
import {NextFunction, Request, Response} from "express"
import {info, error as _error} from "./logger"
import Business from "../models/Business"
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import BusinessContract from "../models/BusinessContract"
import WorkContract from "../models/WorkContract"
import { deleteAgencyTracesOfBusinessContract } from "./common"
import { IBusinessContract } from "../objecttypes/modelTypes"
import { CallbackError } from "mongoose"

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  info("Method:", req.method)
  info("Path:  ", req.path)
  info("Body:  ", req.body)
  info("---")
  next()
}

export const unknownEndpoint = (_req: Request, res: Response) => {
  res.status(404).send({ error: "unknown endpoint" })
}

export const errorHandler = (err: any, _req: Request, res: Response, next: NextFunction): any => {
  _error(err.message)

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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No business found with the request businessId." }
 * @throws {JSON} Status 400 - response.body: { error: "No businessId in request body." }
 * @returns {NextFunction} next()
 */
export const bodyBusinessExists = (req: Request, res: Response, next: NextFunction): any => {
  try {
    if (req.body.businessId) {
      return Business.findById({ _id: req.body.businessId }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No worker found with the request workerId." }
 * @throws {JSON} Status 400 - response.body: { error: "No workerId in request body." }
 * @returns {NextFunction} next()
*/
export const bodyWorkerExists = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.workerId) {
      return Worker.findById({ _id: req.body.workerId }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No worker found with the request workerId." }
 * @throws {JSON} Status 404 - response.body: { error: "No business found with the request businessId." }
 * @throws {JSON} Status 404 - response.body: { error: "Body doesn't include workerId or businessId" }
 * @returns {NextFunction} next()
*/
export const bodyWorkerOrBusinessExists = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.workerId && !req.body.businessId) {
      return Worker.findById({ _id: req.body.workerId }, (err:Error, result:any) => {
        if (err || !result) {
          return res.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          req.body.worker = result
          req.body.contractType = "Worker"
          return next()
        }
      })
    } else if (!req.body.workerId && req.body.businessId) {
      return Business.findById({ _id: req.body.businessId }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No Agency found with the request :agencyId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :agencyId in url." }
 * @returns {NextFunction} next()
*/
export const agencyExists = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.agencyId) {
      return Agency.findById({ _id: req.params.agencyId }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No Business found with the request :businessId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :businessId in url." }
 * @returns {NextFunction} next()
*/
export const businessExists = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.businessId) {
      return Business.findById({ _id: req.params.businessId }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - request.body: { error: "No BusinessContract found with the request :businessContractId." }
 * @throws {JSON} Status 400 - request.body: { error: "No :businessContractId in url." }
 * @returns {NextFunction} next()
*/
export const businessContractExists = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.businessContractId) {
      return BusinessContract.findById({ _id: req.params.businessContractId }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const businessContractIncludesUser = (req: Request,res: Response,next: NextFunction) => {
  try {
    if (req.body.businessContract !== undefined) {
      if (req.body.businessContract.agency._id.toString() === res.locals.decoded.id.toString()) { // TODO Agency hasn't been populated, so _id is undefined, so an exception will be caught.
        req.body.userInBusinessContract = true
      } else {
        switch (req.body.businessContract.worker) {
        case undefined:
          if (req.body.businessContract.business._id.toString() === res.locals.decoded.id.toString()) {
            req.body.userInBusinessContract = true
          }
          break
        default:
          if (req.body.businessContract.worker._id.toString() === res.locals.decoded.id.toString()) {
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
    _error("exception:\n"+exception)
    return res.status(500).send("Exception:\n"+exception)
  }
}

/**
 * Checks if a WorkContract with url param :contractId exists.
 * Saves found WorkContract to request.body.workContract if workContract exists.
 * @param {String} req.params.contractId - ContractId from parameters (url).
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { error: "No WorkContract found with the request :contractId." }
 * @throws {JSON} Status 400 - response.body: { error: "No :contractId in url." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
*/
export const workContractExists = (req: Request,res: Response, next: NextFunction) => {
  try {
    if (req.params.contractId) {
      return WorkContract.findById({ _id: req.params.contractId }, (err: Error,result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const workContractIncludesUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.workContract !== undefined) {
      // if (req.body.workContract.user._id.toString() === res.locals.decoded.id.toString()) {
      //   req.body.userInWorkContract = true
      // }
      if (req.body.workContract.business._id.toString() === res.locals.decoded.id.toString()) {
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
 * This middleware is used to check previous middleware workContractIncludesUser
 * to avoid dupplicate code.
 * @param {Boolean} req.body.userInWorkContract - Boolean that indicates user who is trying to use route is found in contract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message:"User not found in WorkContract and is not authorized to use this route." }
 * @returns {NextFunction} next()
 */
export const checkUserInWorkContract = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    if (body.userInWorkContract === true) {
      return next()
    } else {
      return res.status(401).send( { message:"User not found in WorkContract and is not authorized to use this route." } )
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Checks if the logged in user is an Agency.
 * Agency object from database is populated to request.body.agency
 * @param {String} res.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { message: "This route is only available to Agency users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
*/
export const needsToBeAgency = (req: Request, res: Response, next: NextFunction) => {
  try {
    return Agency.findById({ _id: res.locals.decoded.id }, (err: Error, result: any) => {
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
 * @param {String} res.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route only available to Business users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
*/
export const needsToBeBusiness = (req: Request, res: Response, next: NextFunction) => {
  try {
    return Business.findById({ _id: res.locals.decoded.id }, (err: Error, result: any) => {
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
 * @param {String} res.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route only available to Worker users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
*/
export const needsToBeWorker = (req: Request, res: Response, next: NextFunction) => {
  try {
    return Worker.findById({ _id: res.locals.decoded.id }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency or Business users." }
 * @throws {JSON} Status 401 - response.body: { error }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const needsToBeAgencyOrBusiness = (req: Request, res: Response, next: NextFunction) => {
  try {
    return Agency.findById( { _id: res.locals.decoded.id }, (err: Error, result: any) => {
      if (!err) {
        if (!result) {
          Business.findById({ _id: res.locals.decoded.id }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Business or Worker users" }
 * @throws {JSON} Status 401 - response.body: { error }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const needsToBeBusinessOrWorker = (req: Request, res: Response, next: NextFunction) => {
  try {
    return Business.findById( { _id: res.locals.decoded.id }, (err: Error, result: Response) => {
      if (!err) {
        if (!result) {
          Worker.findById( { _id: res.locals.decoded.id }, (err: Error, result: Response) => {
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
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency, Business or Worker users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const needsToBeAgencyBusinessOrWorker = (req: Request, res: Response, next: NextFunction) => {
  try {
    return Agency.findById({ _id: res.locals.decoded.id }, (err: Error,result: any) => {
      if (!err) {
        if (!result) {
          Business.findById({ _id: res.locals.decoded.id }, (err: Error, result: any) => {
            if (!err) {
              if (!result) {
                Worker.findById({ _id: res.locals.decoded.id }, (err: Error, result: any) => {
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
 * @param {NextFunction} next - Express NextFunction.
 * @throws {JSON} Status 204 - response.body: { message:"Agency doesn't have any BusinessContracts" }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const checkAgencyBusinessContracts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.commonContractIndex = -1
    if (req.body.agency.businessContracts || req.body.agency.businessContracts.length > 0) {
      await Promise.all(req.body.agency.businessContracts.map(async (element: any) => {
        await BusinessContract.findById(element._id,{ business: 1, user: 1, contractMade: 1  },null, async (err: CallbackError, contract: IBusinessContract | null) => {
          if (err) {
            req.body.commonContractIndex = -1
          } else {
            console.log("Element:", element)
            if (!contract) {
              await deleteAgencyTracesOfBusinessContract(req.body.agencyId, element, (result: any) => {
                if (!result.success) {
                  _error("Contract link could not be deleted")
                } else {
                  info("Contract link deleted")
                }
              })
            } else {
              console.log("Result:", contract)
              switch (contract.business) {
              case undefined:
                // if (contract.user.toString() === req.body.workerId.toString() && contract.contractMade === true) {
                //   req.body.commonContractIndex += 1
                // }
                break
              default:
                if (contract.business.toString() === req.body.businessId.toString() && contract.contractMade) {
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
/**
 * Middleware function that is used to update workContract.
 * Gets update from req.body.workContractUpdate.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - res.body: { message: "This route is only available to Agency,Business and Worker who are in this contract." }
 * @throws {JSON} Status 400 - res.body: { success: false, error: "Could not update WorkContract with id " + req.params.contractId }
 * @returns {NextFunction} next()
 */
 export const updateWorkContract = async (req: Request, res: Response, next: NextFunction) => {
  // TODO: Validate the id, check that the logged in user is authored for this
  // TODO: What form the end date need to be?
  const { body } = req
  try {
    const updateFields = body.workContractUpdate
    return WorkContract.updateOne( body.updateFilterQuery , updateFields, { new: false, omitUndefined: true, runValidators: false }, (error, result) => {
      if (!result || error) {
        return res.status(400).send(error || { success: false, error: "Could not update WorkContract with id " + req.params.contractId })
      } else {
        return res.status(200).send(result)
      }
    })
  } catch (exception) {
    return next(exception)
  }
}
/**
 * Used to add worker to contract in WorkerContract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const addWorkerToWorkContract = (req: Request, res: Response, next: NextFunction) => {
  const { body,params } = req
  try { //Täytyy tarkistaa onko Worker ja Agency solminut työsopimuksen keskenään.
    body.workContractUpdate = { $addToSet: { 'contracts.$.workers': res.locals.decoded.id }}
    body.updateFilterQuery = { 'contracts._id': params.contractsId }
    next()
  } catch (exception) {
    return next(exception)
  }
}
/**
 * Used to populate body.workContractUpdate. Adds new contract to workContract object.
 * Needs from user:
 * body.workerCount
 * StartDate
 * EndDate
 * @param {Request} req - Express Request.
 * @param {Response} _res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const newContractToWorkContract = (req: Request, _res: Response, next: NextFunction) => {
  const { body, params } = req
  try {
    body.workContractUpdate = {
      $addToSet: { contracts: {
        workers: [],
        workerCount: body.workerCount,
        acceptedAgency: false,
        acceptedBusiness: false,
        validityPeriod: {
          startDate: Date.now(),
          endDate: Date.now()
          },
        }
      }
    }
    body.updateFilterQuery = { _id: params.contractId }
    next()
  } catch (exception) {
    return next(exception)
  }
}
/**
 * This middleware is used to populate body.workContractUpdate.
 * Changes acceptedAgency to true or acceptedBusiness to true depending wich user is using the route.
 * @param {Request} req - Express Request.
 * @param {Response} _res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const acceptWorkContract = (req: Request, _res: Response, next: NextFunction) => {
  const { body,params } = req
  try {
    if (body.business === undefined || null) {
      body.workContractUpdate = {
        $set: { 'contracts.$.acceptedAgency': true }
      }
    } else {
      body.workContractUpdate = {
        $set: { 'contracts.$.acceptedBusiness': true }
      }
    }
    body.updateFilterQuery = { 'contracts._id': params.contractsId }
    next()
  } catch (exception) {
    return next(exception)
  }
}
export default {}