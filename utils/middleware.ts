/** Contains all middleware functions that are used in routes.
 * @module utils/middleware
 * @requires logger
 * @requires Worker
 * @requires Business
 * @requires Agency
 */
import {NextFunction, Request, Response} from "express"
import {error as _error, info} from "./logger"
import Business from "../models/Business"
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import {IAgencyDocument, IBusinessDocument, IWorkerDocument} from "../objecttypes/modelTypes"
import {CallbackError, DocumentDefinition} from "mongoose"
import {IBaseBody, IBodyWithIds} from "../objecttypes/otherTypes"

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
export const bodyBusinessExists = (req: Request<unknown, unknown, IBodyWithIds>, res: Response, next: NextFunction): any => {
  const { body } = req
  try {
    if (body.businessId) {
      return Business.findById(body.businessId,
        undefined,
        { lean: true },
        (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
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
export const bodyWorkerExists = (req: Request<unknown, unknown, IBodyWithIds>, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    if (body.workerId) {
      return Worker.findById(body.workerId,
        undefined,
        { lean: true },
        (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
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
 * IF Worker exists populate Worker Object to request.body.worker.
 * IF Business exists populate Business Object to request.body.business.
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
  const { body } = req
  try {
    if (body.workerId && !body.businessId) {
      return Worker.findById(body.workerId, (error: CallbackError, result: IWorkerDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({ error: "No worker found with the request workerId." })
        } else {
          body.worker = result
          return next()
        }
      })
    } else if (!body.workerId && body.businessId) {
      return Business.findById(body.businessId, (error: CallbackError, result: IBusinessDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({ error: "No business found with the requested businessId." })
        } else {
          body.business = result
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
  const { params, body } = req
  try {
    if (params.agencyId) {
      return Agency.findById(params.agencyId, (error: CallbackError, result: IAgencyDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({ error: "No Agency found with the request :agencyId." })
        } else {
          body.agency = result
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
  const { params, body } = req
  try {
    if (params.businessId) {
      return Business.findById(params.businessId, (error: CallbackError, result: IBusinessDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({ error: "No Business found with the request :businessId." })
        } else {
          body.business = result
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
 * Checks if the logged in user is an Agency.
 * Agency object from database is populated to req.body.agency
 * @param {String} res.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - response.body: { message: "This route is only available to Agency users." }
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
*/
export const needsToBeAgency = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    return Agency.findById(res.locals.decoded.id, (error: CallbackError, result: IAgencyDocument | null) => {
      if (error) {
        return res.status(500).send(error)
      } else if (!result) {
        return res.status(401).send({ message: "This route is only available to Agency users." })
      } else {
        body.agency = result
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
  const { body } = req
  try {
    return Business.findById(res.locals.decoded.id, (error: CallbackError, result: IBusinessDocument | null) => {
      if (error) {
        return res.status(500).send(error)
      } else if (!result) {
        return res.status(401).send({ message: "This route only available to Business users." })
      } else {
        body.business = result
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
  const { body } = req
  try {
    return Worker.findById(res.locals.decoded.id, (error: CallbackError, result: IWorkerDocument | null) => {
      if (error) {
        return res.status(500).send(error)
      } else if (!result) {
        return res.status(401).send({ message: "This route only available to Worker users." })
      } else {
        body.worker = result
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
  const { body } = req
  try {
    return Agency.findById(res.locals.decoded.id, (error: CallbackError, result: IAgencyDocument | null) => {
      if (!error) {
        if (!result) {
          Business.findById(res.locals.decoded.id, (error: CallbackError, result: IBusinessDocument | null) => {
            if (error) {
              return res.status(500).send(error)
            } else if (!result) {
              return res.status(401).send({ message: "This route is only available to Agency or Business users." })
            } else {
              body.business = result
              return next()
            }
          })
        } else {
          body.agency = result
          return next()
        }
      } else {
        return res.status(500).send(error)
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
    return Business.findById(res.locals.decoded.id, (error: CallbackError, result:  IBusinessDocument | null) => {
      if (!error) {
        if (!result) {
          Worker.findById(res.locals.decoded.id, (error: CallbackError, result: IWorkerDocument | null) => {
            if (error) {
              return res.status(500).send(error)
            } else if (!result) {
              return res.status(401).send({ message: "This route is only available to Business or Worker users" })
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
        return res.status(500).send(error)
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
    return Agency.findById(res.locals.decoded.id, (error: CallbackError, result: IAgencyDocument | null) => {
      if (error) {
        return res.status(500).send(error)
      }
      if (result) {
        body.agency = result
        return next()
      }
      Business.findById(res.locals.decoded.id, (error: CallbackError, result: IBusinessDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        }
        if (result) {
          body.business = result
          return next()
        }
        Worker.findById(res.locals.decoded.id, (error: CallbackError, result: IWorkerDocument | null) => {
          if (error) {
            return res.status(500).send(error)
          } else if (!result) {
            return res.status(401).send({ message: "This route is only available to Agency, Business or Worker users." })
          } else {
            body.worker = result
            return next()
          }
        })
      })
    })
  } catch (error) {
    return res.status(500).send({ error })
  }
}

export default {}