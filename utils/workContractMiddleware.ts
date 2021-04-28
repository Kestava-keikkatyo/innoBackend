import {NextFunction, Request, Response} from "express";
import WorkContract from "../models/WorkContract";
import {CallbackError, DocumentDefinition, Types} from "mongoose";
import {IBusinessContractDocument, IWorkContractDocument, IWorkerDocument} from "../objecttypes/modelTypes";
import {ParamsDictionary} from "express-serve-static-core";
import {IBaseBody} from "../objecttypes/otherTypes";
import BusinessContract from "../models/BusinessContract";
import Worker from "../models/Worker";

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
export const workContractExists = (req: Request, res: Response, next: NextFunction) => {
  const {body, params} = req
  try {
    if (params.contractId) {
      return WorkContract.findById(params.contractId, (error: CallbackError, result: IWorkContractDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({error: "No WorkContract found with the request :contractId."})
        } else {
          body.workContract = result
          return next()
        }
      })
    } else {
      return res.status(400).send({error: "No :contractId in url."})
    }
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * Checks if user who is using route is in WorkContract. Works for Business and Agency!
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
export const workContractIncludesUser = (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body} = req
  try {
    if (body.workContract !== undefined) {
      if (body.workContract.business.toString() === res.locals.decoded.id.toString()) {
        body.userInWorkContract = true
      } else if (body.workContract.agency.toString() === res.locals.decoded.id.toString()) {
        body.userInWorkContract = true
      } else { //Finding workers from WorkContract is very slow and ugly operation.
        if (body.worker) {
          body.workContract.contracts.some(contract => {
            if (body.worker?.workContracts.includes(contract._id)) {
              return body.userInWorkContract = true
            } else {
              return false
            }
          })
        } else {
          body.userInWorkContract = false
        }
      }
    } else {
      body.userInWorkContract = false
    }
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * This middleware is used to check previous middleware workContractIncludesUser
 * to avoid duplicate code.
 * @param {Boolean} req.body.userInWorkContract - Boolean that indicates user who is trying to use route is found in contract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 401 - response.body: { message:"User not found in WorkContract and is not authorized to use this route." }
 * @returns {NextFunction} next()
 */
export const checkUserInWorkContract = (req: Request, res: Response, next: NextFunction) => {
  const {body} = req
  try {
    if (body.userInWorkContract === true) {
      return next()
    } else {
      return res.status(401).send({message: "User not found in WorkContract and is not authorized to use this route."})
    }
  } catch (exception) {
    next(exception)
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
  const {body} = req
  try {
    const updateFields = body.workContractUpdate
    return WorkContract.updateOne(body.updateFilterQuery,
      updateFields,
      {omitUndefined: true},
      (error: CallbackError, rawResult: IWorkContractDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!rawResult) {
          return res.status(400).send({
            success: false,
            error: "Could not update WorkContract with id " + req.params.contractId
          })
        } else {
          return res.status(200).send(rawResult) // TODO Halutaanko palauttaa rawResult?
        }
      })
  } catch (exception) {
    return res.status(500).send({exception})
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
export const addWorkerToWorkContract = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractsId)
  } catch (exception) {
    return res.status(403).send({message: "contractsId must be a valid string."})
  }
  try {
    //First we check that Worker has made BusinessContract with Agency.
    return BusinessContract.find(
      {
        agency: body.workContract?.agency,
        'madeContracts.workers': body.worker?._id
      },
      undefined,
      {lean: true},
      (error: CallbackError, doc: DocumentDefinition<IBusinessContractDocument>[] | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!doc) {
          return res.status(400).send({message: "Something went wrong with find query."})
        } else {
          if (doc.length === 1) {
            //Then we check that is user already add accepted to the contract.
            if (body.worker?.workContracts.includes(id)) {
              return res.status(403).send({message: " Worker has already added to the contract."})
            } else {
              body.workContractUpdate = {$addToSet: {'contracts.$.requestWorkers': res.locals.decoded.id}}
              body.updateFilterQuery = {'contracts._id': id}
              return next()
            }
          } else {
            return res.status(404).send({message: "No BusinessContract made with agency and worker."})
          }
        }
      }
    )
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * Middleware function is used in add-route to add trace to worker workContract array.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 400 - res.body: { message:"Something went wrong with update" }
 */
export const addTraceToWorker = (req: Request, res: Response, next: NextFunction) => {
  const {params} = req
  let ids: Types.ObjectId
  try {
    ids = Types.ObjectId(params.contractsId)
  } catch (exception) {
    return res.status(403).send({message: "contractsId must be a valid string."})
  }
  try {
    return Worker.findOneAndUpdate(
      {_id: res.locals.decoded.id},
      {$addToSet: {workContracts: ids}},
      {lean: true},
      (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
        if (error || !result) {
          return res.status(500).send(error || {message: "Received no result from database when updating worker"})
        } else {
          return next()
        }
      }
    )
  } catch (exception) {
    return res.status(500).send({exception})
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
export const newContractToWorkContract = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractId)
  } catch (exception) {
    return res.status(403).send({message: "contractId must be a valid string."})
  }
  try {
    body.workContractUpdate = {
      $addToSet: {
        contracts: {
          workers: [],
          workerCount: body.workerCount,
          acceptedAgency: false,
          acceptedBusiness: false,
          validityPeriod: {
            startDate: new Date(),
            endDate: new Date() // TODO need start and end date
          },
        }
      }
    }
    body.updateFilterQuery = {_id: id}
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * This middleware is used to populate body.workContractUpdate.
 * Changes acceptedAgency to true or acceptedBusiness to true depending on which user is using the route.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const acceptWorkContract = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractsId)
  } catch (exception) {
    return res.status(403).send({message: "contractsId must be a valid string."})
  }
  try {
    if (!body.business && body.agency) {
      body.workContractUpdate = {
        $set: {'contracts.$.acceptedAgency': true}
      }
    } else if (body.business && !body.agency) {
      body.workContractUpdate = {
        $set: {'contracts.$.acceptedBusiness': true}
      }
    } else {
      res.status(401).send({message: "User is not Business or Agency."})
    }
    body.updateFilterQuery = {'contracts._id': id}
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractsId)
  } catch (exception) {
    return res.status(403).send({message: "contractsId must be a valid string."})
  }
  try {
    body.workContractUpdate = {
      $pull: {
        'contracts.$.requestWorkers': {$in: body.workersArray}
      },
      $addToSet: {
        'contracts.$.acceptedWorkers': {$each: body.workersArray}
      },
      $set: {
        'contracts.$.acceptedBusiness': false
      }
    }
    body.updateFilterQuery = {'contracts._id': id}
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractsId)
  } catch (exception) {
    return res.status(403).send({message: "contractsId must be a valid string."})
  }
  try {
    body.workContractUpdate = {
      $pull: {
        'contracts.$.acceptedWorkers': {$in: body.workersArray}
      },
      $addToSet: {
        'contracts.$.requestWorkers': {$each: body.workersArray}
      },
      $set: {
        'contracts.$.acceptedBusiness': false
      }
    }
    body.updateFilterQuery = {'contracts._id': id}
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * This middleware function is used to initialize update that removes workerIds
 * from acceptedWorkers array and requestWorkers array.
 * Also changes acceptedBusiness and acceptedAgency to false.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const declineWorkers = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractsId)
  } catch (exception) {
    return res.status(403).send({message: "Note: contractsId must be string."})
  }
  try {
    body.workContractUpdate = {
      $pull: {
        'contracts.$.acceptedWorkers': {$in: body.workersArray},
        'contracts.$.requestWorkers': {$in: body.workersArray}
      },
      $set: {
        'contracts.$.acceptedBusiness': false,
        'contracts.$.acceptedAgency': false
      }
    }
    body.updateFilterQuery = {'contracts._id': id}
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
export default {}