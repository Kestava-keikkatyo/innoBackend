import express, {NextFunction, Request, Response} from 'express'
import authenticateToken from "../utils/auhenticateToken"
import Worker from "../models/Worker"
import BusinessContract from "../models/BusinessContract"
import WorkContract from "../models/WorkContract"
import { needsToBeWorker, needsToBeAgencyOrBusiness } from "../utils/middleware"
import { workerExists, buildPaginatedObjectFromArray } from "../utils/common"
import {IBusinessContract, IFeelings, IWorkContract, IWorker} from "../objecttypes/modelTypes";
import {CallbackError, DocumentDefinition, Types} from "mongoose";
import {error as _error, info as _info} from "../utils/logger";
import {IBaseBody, IBodyWithFeelings} from "../objecttypes/otherTypes";
import {ParamsDictionary} from "express-serve-static-core";

const feelingsRouter = express.Router()
/**
 * Returns response.body: { The updated Worker object }
 * Route for worker to add a feeling.
 * request.body requirements: {value: Int}. That is the minimum, can also be {value: Int, note: "note"}
 * Must be logged in as worker.
 */
feelingsRouter.post("/", authenticateToken, needsToBeWorker, async (req: Request<unknown, unknown, IBodyWithFeelings>, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    if (body.value !== undefined) {
      const feelingsObject: IFeelings = { value: body.value, note: body.note }
      Worker.findByIdAndUpdate(
        // User id got from middleware.js. AddToSet adds 'value' and 'note' to feelings array. Note not added if undefined.
        res.locals.decoded.id,
        { $addToSet: { feelings: feelingsObject } },
        { new: true, omitUndefined: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IWorker> | null) => {
          if (!result || error) {
            res.status(401).send(error || { message: "Received no result when updating user" })
          } else {
            res.status(200).send({ value: body.value, note: body.note })
          }
        })
    } else {
      res.status(400).send({ error: "Request body must include 'value' field" })
    }

  } catch (exception) {
    return next(exception)
  }
})

/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for worker to get a list of their feelings.
 * Must be logged in as worker.
 */
feelingsRouter.get("/", authenticateToken, needsToBeWorker, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query, body } = req
  try {
    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    // Returning feelings in the same format that the pagination library would return paginated results
    if (body.worker) {
      res.status(200).send(buildPaginatedObjectFromArray(page, limit, body.worker.feelings))
    } else {
     res.status(500).send({ error: "Worker object was undefined for some reason" })
    }
  } catch (exception) {
    return next(exception)
  }
})

// TODO mention query parameters in docs
/**
 * Returns a list of feelings. response.body: [{ feeling object }, { feeling object }, ...]
 * Route for agency/business to get a list of a worker's feelings they have a contract with.
 */
feelingsRouter.get("/:workerId", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query, params, body } = req

  try {
    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }

    const workerId: string = params.workerId
    workerExists(workerId, (worker: IWorker | null) => {
      if (!worker) {
        return res.status(404).send( { message: "Worker with ID " + workerId + " not found" })
      }

      if (body.agency) {
        // Check if agency has business contract with worker.
        const contractIds = body.agency.businessContracts
        return BusinessContract.find(
            { _id: { $in: contractIds } },
            (error: CallbackError, contracts: Array<IBusinessContract>) => {
              if (error) {
                return res.status(500).send(`error message: ${error.message}\n${error}`)
              }
              for (let i = 0; i < contracts.length; i++) {
                // if (contracts[i].worker && contracts[i].worker instanceof Types.ObjectId && (contracts[i].worker as Types.ObjectId).equals(workerId)) {
                //   if (contracts[i].contractMade) {
                //     // Contract with worker found, so agency is allowed to see worker feelings.
                //     return res.status(200).send(buildPaginatedObjectFromArray(page, limit, worker.feelings))
                //   } else {
                //     // Contract found, but contractMade is false, so worker hasn't approved it yet.
                //     return res.status(403).send( { message: "Worker has yet to approve contract." })
                //   }
                // }
              }
              // Contract with worker was not found. Not allowed to see feelings.
              return res.status(403).send( { message: "Not allowed to see worker feelings if no contract has been made with them." })
            }
        )

      } else if (body.business) {
        // Check if business has a work contract with worker.
        const contractIds = body.business.workContracts
        return WorkContract.find(
            { _id: { $in: contractIds } },
            (error: CallbackError, result: Array<IWorkContract>) => {
              if (error) {
                res.status(500).send(`error message: ${error.message}\n${error}`)
              }
              for (let i = 0; i < result.length; i++) {
                for (let j = 0; j < result[i].contracts.length; j++) {
                  for (let k = 0; k < result[i].contracts[j].workers.length; k++) {
                    if (result[i].contracts[j].workers[k] instanceof Types.ObjectId && (result[i].contracts[j].workers[k] as Types.ObjectId).equals(workerId)) {
                      if (Date.now() >= result[i].contracts[j].validityPeriod.startDate.getTime() && Date.now() <= result[i].contracts[j].validityPeriod.endDate.getTime()) {
                        // Contract with worker found, so business is allowed to see worker feelings.
                        return res.status(200).send(buildPaginatedObjectFromArray(page, limit, worker.feelings))
                      } else {
                        // Contract found, but validityPeriod has passed, so contract is no longer valid.
                        return res.status(403).send( { message: "Contract with worker hasn't started yet or has expired." })
                      }
                    }
                  }
                }
              }
              // Contract with worker was not found. Not allowed to see feelings.
              return res.status(403).send( { message: "Not allowed to see worker feelings if no contract has been made with them." })
            })

      } else {
        return res.status(401).send( { message: "Not authorized" })
      }

    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for worker to delete one of their own feelings by providing an id of that feeling as a parameter.
 */
feelingsRouter.delete("/:feelingId", authenticateToken, needsToBeWorker, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params, body } = req

  try {
    let found: boolean = false
    if (!body.worker) {
      return res.status(500).send({ error: "Worker object was undefined for some reason" })
    }
    for (const feeling of body.worker.feelings) {
      if (!feeling._id) {
        return res.status(500).send({ error: "Id in Worker object was undefined for some reason" })
      }
      if (feeling._id.equals(params.feelingId)) {
        found = true
        return Worker.findByIdAndUpdate(
          body.worker._id,
          {$pull: {feelings: {_id: params.feelingId}}},
          {lean: true},
          (error: CallbackError, result: DocumentDefinition<IWorker> | null) => {
            if (!result || error) {
              return res.status(500).send(error || {message: "Did not receive any result from database"})
            } else {
              return res.status(204).send()
            }
          })
      }
    }
    if (!found) {
      return res.status(404).send({ message: `Could not find feeling with id ${params.feelingId}` })
    }
  } catch (exception) {
    return next(exception)
  }
})

export default feelingsRouter