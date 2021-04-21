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
import {
  IAgencyDocument,
  IBusinessContractDocument, IBusinessDocument,
  IWorkContractDocument,
  IWorkerDocument
} from "../objecttypes/modelTypes"
import { businessExistsCallback, workerExistsCallback } from "../utils/common"
import { CallbackError, DocumentDefinition, Types } from "mongoose"
import { IBaseBody } from "../objecttypes/otherTypes"
import { ParamsDictionary } from "express-serve-static-core"

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
      return Business.findById({ _id: req.body.businessId }, (err: CallbackError, result: IBusinessDocument | null) => {
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
      return Worker.findById({ _id: req.body.workerId }, (err: CallbackError, result: IWorkerDocument | null) => {
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
      return Worker.findById({ _id: req.body.workerId }, (err:CallbackError, result: IWorkerDocument | null) => {
        if (err || !result) {
          return res.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          req.body.worker = result
          req.body.contractType = "Worker"
          return next()
        }
      })
    } else if (!req.body.workerId && req.body.businessId) {
      return Business.findById({ _id: req.body.businessId }, (err: CallbackError, result: IBusinessDocument | null) => {
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
      return Agency.findById({ _id: req.params.agencyId }, (err: CallbackError, result: IAgencyDocument | null) => {
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
      return Business.findById({ _id: req.params.businessId }, (err: CallbackError, result: IBusinessDocument | null) => {
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
export const businessContractExists = (req: Request<ParamsDictionary,unknown,IBaseBody>, res: Response, next: NextFunction) => {
  const { body,params } = req
  try {
    if (params.businessContractId) {
      return BusinessContract.findById({ _id: params.businessContractId }, (err: CallbackError, result:IBusinessContractDocument | null) => {
        if (err || !result) {
          return res.status(404).send({ error: "No BusinessContract found with the request :businessContractId." })
        } else {
          body.businessContract = result
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
export const businessContractIncludesUser = (req: Request<unknown,unknown,IBaseBody>,res: Response,next: NextFunction) => {
  const { body } = req
  try {
    if (body.businessContract !== undefined) {
      if (body.businessContract.agency.toString() === res.locals.decoded.id.toString()) { // TODO Agency hasn't been populated, so _id is undefined, so an exception will be caught.
        body.userInBusinessContract = true
      } else {
        if (body.businessContract.madeContracts.businesses.includes(res.locals.decoded.id)) {
          body.userInBusinessContract = true
        } else if (body.businessContract.madeContracts.workers.includes(res.locals.decoded.id)) {
          body.userInBusinessContract = true
        }
      }
    } else {
      body.userInBusinessContract = false
    }
    return next()
  } catch (exception) {
    _error("exception:\n"+exception)
    return res.status(500).send("Exception:\n"+exception)
  }
}

/**
 * Checks if a WorkContract with PATH VARIABLE (url param :contractId) exists.
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
export const pathWorkContractExists = (req: Request,res: Response, next: NextFunction) => {
  const { body,params } = req
  try {
    if (params.contractId) {
      return WorkContract.findById({ _id: params.contractId }, (err: CallbackError, result: IWorkContractDocument | null) => {
        if (err || !result) {
          return res.status(404).send({ error: "No WorkContract found with the request :contractId." })
        } else {
          body.workContract = result
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
 * Checks if user who is using route is in workcontract. Works for Business and Agency!
 * For this to work token must be authenticated with authenticateToken function and workContract must exist. 
 * Use this after pathWorkContractExists function.
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
    return Agency.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IAgencyDocument | null) => {
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
    return Business.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IBusinessDocument | null) => {
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
    return Worker.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IWorkerDocument | null) => {
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
    return Agency.findById( { _id: res.locals.decoded.id }, (err: CallbackError, result: IAgencyDocument | null) => {
      if (!err) {
        if (!result) {
          Business.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IBusinessDocument | null) => {
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
export const needsToBeBusinessOrWorker = (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    return Business.findById( { _id: res.locals.decoded.id }, (err: CallbackError, result:  IBusinessDocument | null) => {
      if (!err) {
        if (!result) {
          Worker.findById( { _id: res.locals.decoded.id }, (err: CallbackError, result: IWorkerDocument | null) => {
            if (err || !result) {
              return res.status(401).send( err || { message: "This route is only available to Business or Worker users" })
            } else {
              body.worker = result
              return next()
            }
          })
        } else {
          body.business = result
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
export const needsToBeAgencyBusinessOrWorker = (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    return Agency.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IAgencyDocument | null) => {
      if (!err) {
        if (!result) {
          Business.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IBusinessDocument | null) => {
            if (!err) {
              if (!result) {
                Worker.findById({ _id: res.locals.decoded.id }, (err: CallbackError, result: IWorkerDocument | null) => {
                  if (err || !result) {
                    return res.status(401).send(err || { message: "This route is only available to Agency, Business or Worker users." })
                  } else {
                    body.worker = result
                    return next()
                  }
                })
              } else {
                body.business = result
                return next()
              }
            } else {
              return res.status(400).send({ message: "Business find coused error." })
            }
          })
        } else {
          body.agency = result
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
 * Middleware function that is used to update workContract.
 * Gets update from req.body.workContractUpdate.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @throws {JSON} Status 401 - res.body: { message: "This route is only available to Agency,Business and Worker who are in this contract." }
 * @throws {JSON} Status 400 - res.body: { success: false, error: "Could not update WorkContract with id " + req.params.contractId }
 * @returns {JSON} Status 200 - res.body: { doc } 
 */
 export const updateWorkContract = (req: Request, res: Response) => {
  // TODO: Validate the id, check that the logged in user is authored for this
  // TODO: What form the end date need to be?
  const { body } = req
  try {
    const updateFields = body.workContractUpdate
    return WorkContract.updateOne( body.updateFilterQuery , updateFields, { new: true, omitUndefined: true, runValidators: false, lean: true },
      (error:CallbackError, doc:DocumentDefinition<IWorkContractDocument> | null) => {
      if (!doc || error) {
        return res.status(400).send(error || { success: false, error: "Could not update WorkContract with id " + req.params.contractId })
      } else {
        return res.status(200).send(doc)
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * Used to add worker to contract in WorkerContract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 400 - res.body: { error:err, message:"Something went wrong with find query." }
 * @throws {JSON} Status 404 - res.body: { message:"No BusinessContract made with agency and worker." }
 * @returns {NextFunction} next()
 */
export const addWorkerToWorkContract = (req: Request, res: Response, next: NextFunction) => {
  const { body,params } = req
  try {
    return BusinessContract.find({
      agency: body.workContract.agency,
      'madeContracts.workers': body.worker._id
    },undefined,{lean:true}, (err: CallbackError, doc: DocumentDefinition<IBusinessContractDocument>[] | null) => {
      if (err || !doc) {
        return res.status(400).send(err || { message:"Something went wrong with find query." })
      } else {
        if (doc.length === 1) {
          body.workContractUpdate = { $addToSet: { 'contracts.$.requestWorkers': res.locals.decoded.id }}
          body.updateFilterQuery = { 'contracts._id': params.contractsId }
          return next()
        } else {
          return res.status(404).send({ message:"No BusinessContract made with agency and worker." })
        }
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * Middleware function is used in add-route to add trace to worker workContract array.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 400 - res.body: { message:"Something went wrong with update" }
 */
export const addTraceToWorker = (req:Request, res:Response, next:NextFunction) => {
  try {
    const { params } = req
    const ids: Types.ObjectId = Types.ObjectId(params.contractsId)
    return Worker.findOneAndUpdate(
      { _id: res.locals.decoded.id },
      { $addToSet: { workContracts: ids } },
      { lean: true },
      (err: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
        if (err || !result) {
          return res.status(400).send(err || {  message:"Something went wrong with update" })
        } else {
          return next()
        }
      }
    )
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * Used to populate body.workContractUpdate. Adds new contract to workContract object.
 * Needs from user:
 * body.workerCount
 * StartDate
 * EndDate
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const newContractToWorkContract = (req: Request<ParamsDictionary,unknown,IBaseBody>, res: Response, next: NextFunction) => {
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
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware is used to populate body.workContractUpdate.
 * Changes acceptedAgency to true or acceptedBusiness to true depending wich user is using the route.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const acceptWorkContract = (req: Request<ParamsDictionary,unknown,IBaseBody>, res: Response, next: NextFunction) => {
  const { body,params } = req
  try {
    if (body.business === undefined || null && body.agency !== undefined || null) {
      body.workContractUpdate = {
        $set: { 'contracts.$.acceptedAgency': true }
      }
    } else if (body.business !== undefined || null && body.agency === undefined || null) {
      body.workContractUpdate = {
        $set: { 'contracts.$.acceptedBusiness': true }
      }
    } else {
      res.status(401).send({ message: "User is not Business or Agency."})
    }
    body.updateFilterQuery = { 'contracts._id': params.contractsId }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to initialize update that moves workerIds
 * from requestWorkers array to acceptedWorkers array.
 * Also changes acceptedBusiness to false.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const acceptWorkers = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body,params } = req
  try { 
    body.workContractUpdate = {
      $pull: {
        'contracts.$.requestWorkers': { $in: body.workersArray }
      },
      $addToSet: {
        'contracts.$.acceptedWorkers': { $each: body.workersArray }
      },
      $set: {
        'contracts.$.acceptedBusiness': false
      }
    }
    body.updateFilterQuery = { 'contracts._id': params.contractsId }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to initialize update that moves workerIds
 * from acceptedWorkers array to requestWorkers array.
 * Also changes acceptedBusiness to false.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const revertWorkers = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body,params } = req
  try { 
    body.workContractUpdate = {
      $pull: {
        'contracts.$.acceptedWorkers': { $in: body.workersArray }
      },
      $addToSet: {
        'contracts.$.requestWorkers': { $each: body.workersArray }
      },
      $set: {
        'contracts.$.acceptedBusiness': false
      }
    }
    body.updateFilterQuery = { 'contracts._id': params.contractsId }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to initialize update that removes workerIds
 * from acceptedWorkers array and requestWorkers array.
 * Also changes acceptedBusiness and accpetedAgency to false.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const declineWorkers = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body,params } = req
  try { 
    body.workContractUpdate = {
      $pull: {
        'contracts.$.acceptedWorkers': { $in: body.workersArray },
        'contracts.$.requestWorkers': { $in: body.workersArray }
      },
      $set: {
        'contracts.$.acceptedBusiness': false,
        'contracts.$.acceptedAgency': false
      }
    }
    body.updateFilterQuery = { 'contracts._id': params.contractsId }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware is used to make BusinessContract for agency in
 * BusinessContract.ts post route.
 * @param {Request} _req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {JSON} Status 201 - Header: { Location: domainUrl + businessContractsApiPath + contract._id }, Response.body: { contract }
 */
export const makeBusinessContract = (_req:Request, res:Response) => {
  const domainUrl = "http://localhost:3000/"
  const businessContractsApiPath = "api/businesscontracts/"
  try {
    //First check that Agency doesn't allready have BusinessContract
    return BusinessContract.find({ // Check if worker has allready businessContract with agency.
      agency: res.locals.decoded.id
    },undefined,{lean:true},(err:CallbackError, docs:DocumentDefinition<IBusinessContractDocument>[] | null) => {
      if (err) {
        return res.status(400).send({ message: "Something caused an error in find query."})
      } else {
        if (!docs) {
          return res.status(500).send({ message: "Docs was null" })
        }
        if (docs.length >= 1) {
          return res.status(302).send({ doc: docs,message:"Agency already has BusinessContract."})
        }
        else {
          //Next initialize BusinessContract fields.
          const businessContract: IBusinessContractDocument = new BusinessContract({
            agency: res.locals.decoded.id,
            madeContracts: {
              businesses: [],
              workers: []
            },
            requestContracts: {
              businesses: [],
              workers: []
            }
          })
          //Then save BusinessContract to db.
          return businessContract.save(undefined,(error: CallbackError, contract: IBusinessContractDocument) => {
          if (error || !contract) {
              return res.status(400).send({ message: "Failed to save Agency BusinessContract."})
          } else {
            info("BusinessContract created with ID " + businessContract._id)
            //Link BusinessContract to Agency
            return Agency.findOneAndUpdate({ _id: res.locals.decoded.id }, { $addToSet: { businessContracts: businessContract._id }},{lean:true},
              (err:CallbackError,doc:DocumentDefinition<IAgencyDocument> | null) => {
                if (err || !doc) {
                //Delete contract if failed
                  return res.status(400).send({ message: "Something went wrong, BusinessContract couldn't be linked to Agency."})
                } else {
                  return res.status(201).header({ Location: domainUrl + businessContractsApiPath + contract._id,}).json({ contract })
                }
              })
          }})
        }
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to add worker or business to BusinessContract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const addContractToBusinessContract = (req:Request<ParamsDictionary,unknown,IBaseBody>, res:Response, next:NextFunction) => {
  const { body,params } = req
  const id:Types.ObjectId = Types.ObjectId(params.businessContractId)
  body.businessContractUpdateFilterQuery =  { _id: id }
  try {
    //Check if worker is trying to make BusinessContract
    if (body.worker === undefined || null) {
      //If worker is null check business
      if (body.business === undefined || null) {
        //If business is null check agency
        if (body.agency === undefined || null || body.userId === undefined || null) {
          return res.status(400).send({message:"Could not identify who tried to create the contract or userId was undefined."})
        } else {
          //If agency is trying to make BusinessContract
          //Then we check wich user agency wants to add
          return businessExistsCallback(body.userId, (result:IBusinessDocument | null) => {
            if (result == null) {
              return workerExistsCallback(body.userId, (result:IWorkerDocument | null) => {
                if (result == null) {
                  return res.status(404).send({ message:"Couldn't find user with userId:"+body.userId })
                } else {
                  body.businessContractUpdate = {
                    $addToSet: {
                      'madeContracts.workers': body.userId
                    }
                  }
                  return Worker.findOneAndUpdate(
                    { _id: body.userId },
                    { $addToSet: { businessContracts: id } },
                    { lean: true },
                    (err:CallbackError, result:DocumentDefinition<IWorkerDocument> | null) => {
                      if (err || !result) {
                        return res.status(400).send(err || {  message:"Something went wrong with adding trace to Worker" })
                      } else {
                        return next()
                      }
                    })
                }
              })
            } else {
              body.businessContractUpdate = {
                $addToSet: {
                  'madeContracts.businesses': body.userId
                }
              }
              //Now we can add trace to Business businessContracts list.
              return Business.findOneAndUpdate(
                { _id: body.userId },
                { $addToSet: { businessContracts: id } },
                { lean: true },
                (err:CallbackError, result:DocumentDefinition<IBusinessDocument> | null) => {
                  if (err || !result) {
                    return res.status(400).send(err || {  message:"Something went wrong with adding trace to Business" })
                  } else {
                    return next()
                  } 
                })
            }
          })
        }
      } else {
        //If business is trying to make BusinessContract we first check that is Business already in contract.
        if (body.businessContract?.madeContracts.businesses.includes(res.locals.decoded.id)) {
          return res.status(401).send({ message: "User is already in contract."})
        } else {
          body.businessContractUpdate = {
            $addToSet: {
              'requestContracts.businesses': body.business._id
            }
          }
          //Now we can add trace to Business businessContracts list.
          return Business.findOneAndUpdate(
          { _id: res.locals.decoded.id },
          { $addToSet: { businessContracts: id } },
          { lean: true },
          (err:CallbackError, result:DocumentDefinition<IBusinessDocument> | null) => {
            if (err || !result) {
              return res.status(400).send(err || {  message:"Something went wrong with adding trace to Business" })
            } else {
              return next()
            }
          })
        }
      }
    } else {
      //If worker is trying to make BusinessContract we first check that is Worker already in contract.
      if (body.businessContract?.madeContracts.workers.includes(res.locals.decoded.id)) {
        return res.status(401).send({ message: "User is already in contract."})
      } else {
        body.businessContractUpdate = {
          $addToSet: {
            'requestContracts.workers': body.worker._id
          }
        }
        //Now we can add trace to Workers businessContracts list.
        return Worker.findOneAndUpdate(
        { _id: res.locals.decoded.id },
        { $addToSet: { businessContracts: id } },
        { lean: true },
        (err:CallbackError, result:DocumentDefinition<IWorkerDocument> | null) => {
          if (err || !result) {
            return res.status(400).send(err || {  message:"Something went wrong with adding trace to Worker" })
          } else {
            return next()
          }
        })
      }
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used in put route accept.
 * Function checks that Business or Worker is found and initializes BusinessContract update that removes
 * id from requestContracts workers/businesses array and adds it to madeContracts workers/businesses array.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const acceptBusinessContract  = async (req:Request<ParamsDictionary,unknown,IBaseBody>, res:Response, next:NextFunction) => {
  const { body,params } = req
  const businessContractId:Types.ObjectId = Types.ObjectId(params.businessContractId)
  const userId:Types.ObjectId = Types.ObjectId(params.userId)
  try {
    const index = await Business.find({_id: userId})
    if (index.length == 1) {
      body.businessContractUpdate = {
        $pull: {
          'requestContracts.businesses': userId
        },
        $addToSet: {
          'madeContracts.businesses': userId
        }
      }
      body.businessContractUpdateFilterQuery =  { _id: businessContractId }
    } else {
      const index = await Worker.find({_id:userId})
      if (index.length == 1) {
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.workers': userId
          },
          $addToSet: {
            'madeContracts.workers': userId
          }
        }
        body.businessContractUpdateFilterQuery =  { _id: businessContractId }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches"+userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used by Agency to decline BusinessContract.
 * Used in PUT route /:businessContractId/:userId/accept.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const declineBusinessContract = async (req:Request<ParamsDictionary,unknown,IBaseBody>, res:Response, next:NextFunction) => {
  const { body,params } = req
  const businessContractId:Types.ObjectId = Types.ObjectId(params.businessContractId)
  const userId:Types.ObjectId = Types.ObjectId(params.userId)
  try {
    const index = await Business.find({_id: userId})
    if (index.length == 1) {
      body.businessContractUpdate = {
        $pull: {
          'requestContracts.businesses': userId
        }
      }
      body.businessContractUpdateFilterQuery =  { _id: businessContractId }
    } else {
      const index = await Worker.find({_id:userId})
      if (index.length == 1) {
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.workers': userId
          }
        }
        body.businessContractUpdateFilterQuery =  { _id: businessContractId }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches"+userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to update BusinessContract.
 * Runs updateOne query to BusinessContract. Used as last middleware to run update.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {JSON} Status 200: doc 
 */
export const businessContractUpdate = (req:Request<ParamsDictionary,unknown,IBaseBody>, res:Response) => {
  const { body, params } = req
  try {
    const updateFields = body.businessContractUpdate
    return BusinessContract.updateOne( body.businessContractUpdateFilterQuery , updateFields, { new: true, omitUndefined: true, runValidators: false },
      (error:CallbackError, doc:any) => {
      if (!doc || error) {
        return res.status(400).send(error || { success: false, error: "Could not update BusinessContract with id " + params.contractId })
      } else {
        return res.status(200).send(doc)
      }
    })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
export default {}