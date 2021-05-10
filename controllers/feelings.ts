import express, {NextFunction, Request, Response} from 'express'
import authenticateToken from "../utils/auhenticateToken"
import Worker from "../models/Worker"
import BusinessContract from "../models/BusinessContract"
import WorkContract from "../models/WorkContract"
import { needsToBeWorker, needsToBeAgencyOrBusiness } from "../utils/middleware"
import { workerExistsCallback, buildPaginatedObjectFromArray } from "../utils/common"
import {IBusinessContractDocument, IFeelings, IWorkContractDocument, IWorkerDocument} from "../objecttypes/modelTypes";
import {CallbackError, DocumentDefinition, Types} from "mongoose";
import {error as _error, info as _info} from "../utils/logger";
import {IBaseBody, IBodyWithFeelings} from "../objecttypes/otherTypes";
import {ParamsDictionary} from "express-serve-static-core";

const feelingsRouter = express.Router()

/**
 * @openapi
 * /feelings:
 *   post:
 *     summary: Route for worker to add a feeling
 *     description: Must be logged in as a worker
 *     tags: [Worker, Feelings]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Feeling"
 *     responses:
 *       "200":
 *         description: Feeling added. Returns added feeling object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Feeling"
 *       "400":
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Request body must include 'value' field
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Received no result from database when updating worker
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
        (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result from database when updating worker" })
          } else {
            return res.status(200).send({ value: body.value, note: body.note })
          }
        })
    } else {
      res.status(400).send({ message: "Request body must include 'value' field" })
    }

  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /feelings:
 *   get:
 *     summary: Route for worker to get a list of their feelings
 *     description: Must be logged in as a worker
 *     tags: [Worker, Feelings]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: page
 *         description: Page number you want to view
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             2
 *       - in: query
 *         name: limit
 *         description: The number of items you want to view per page
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             5
 *     responses:
 *       "200":
 *         description: Returns the worker's feelings paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedFeelings"
 *       "400":
 *         description: Page or limit parameter is missing or incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Missing or incorrect page/limit parameter
 *       "500":
 *         description: Internal error. Middleware function didn't add worker object into request body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Worker object was undefined for some reason
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
     res.status(500).send({ message: "Worker object was undefined for some reason" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /feelings/{workerId}:
 *   get:
 *     summary: Route for agency/business to get a list of a worker's feelings they have a contract with
 *     description: Must be logged in as an agency or a business
 *     tags: [Agency, Business, Feelings]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: workerId
 *         description: ID of the worker whose feelings we want to check.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6018012a88b8375630a6a3c4
 *       - in: query
 *         name: page
 *         description: Page number you want to view
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             1
 *       - in: query
 *         name: limit
 *         description: The number of items you want to view per page
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             5
 *     responses:
 *       "200":
 *         description: Returns the worker's feelings paginated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedFeelings"
 *       "400":
 *         description: Page or limit parameter is missing or incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Missing or incorrect page/limit parameter
 *       "403":
 *         description: Contract with worker hasn't been made or isn't valid anymore.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Not allowed to see worker feelings if no contract has been made with them.
 *       "404":
 *         description: No worker was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Worker with ID {workerId} not found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
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
    workerExistsCallback(workerId, (worker: IWorkerDocument | null) => {
      if (!worker) {
        return res.status(404).send( { message: "Worker with ID " + workerId + " not found" })
      }

      if (body.agency) {
        // Check if agency has business contract with worker.
        const contractIds = body.agency.businessContracts
        return BusinessContract.find(
            { _id: { $in: contractIds } },
            (error: CallbackError, contracts: Array<IBusinessContractDocument>) => {
              if (error) {
                return res.status(500).send(`message: ${error.message}\n${error}`)
              }
              for (let i = 0; i < contracts.length; i++) { // TODO madeContract.workers
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
            (error: CallbackError, result: Array<IWorkContractDocument>) => {
              if (error) {
                res.status(500).send(`message: ${error.message}\n${error}`)
              }
              for (let i = 0; i < result.length; i++) { // TODO Can this be done with just the find query?
                for (let j = 0; j < result[i].contracts.length; j++) {
                  for (let k = 0; k < result[i].contracts[j].acceptedWorkers.length; k++) {
                    if (result[i].contracts[j].acceptedWorkers[k] instanceof Types.ObjectId && (result[i].contracts[j].acceptedWorkers[k] as Types.ObjectId).equals(workerId)) {
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
        // Code should never reach here since middleware populates either body.agency or body.business
        return res.status(401).send( { message: "Not authorized" })
      }

    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /feelings/{feelingId}:
 *   delete:
 *     summary: Route for worker to delete one of their own feelings
 *     description: Must be logged in as a worker
 *     tags: [Worker, Feelings]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: feelingId
 *         description: ID of the feeling which we want to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: 60243862d95c272d6067a8af
 *     responses:
 *       "204":
 *         description: Feeling was deleted successfully.
 *       "404":
 *         description: No feeling was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Could not find a feeling with the ID {feelingId}
 *       "500":
 *         description: An error occurred when calling database, or something in middleware failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
feelingsRouter.delete("/:feelingId", authenticateToken, needsToBeWorker, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params, body } = req

  try {
    let found: boolean = false
    if (!body.worker) {
      return res.status(500).send({ message: "Worker object was undefined for some reason" })
    }
    for (const feeling of body.worker.feelings) {
      if (!feeling._id) {
        return res.status(500).send({ message: "Feeling's ID in Worker object was undefined for some reason" })
      }
      if (feeling._id.equals(params.feelingId)) {
        found = true
        return Worker.findByIdAndUpdate(
          body.worker._id,
          {$pull: {feelings: {_id: params.feelingId}}},
          {lean: true},
          (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
            if (!result || error) {
              return res.status(500).send(error || {message: "Did not receive any result from database"})
            } else {
              return res.status(204).send()
            }
          })
      }
    }
    if (!found) {
      return res.status(404).send({ message: `Could not find a feeling with the ID ${params.feelingId}` })
    }
  } catch (exception) {
    return next(exception)
  }
})

export default feelingsRouter