/** Express router providing WorkContract-related routes
 * @module controllers/workcontracts
 * @requires express
 */

/**
 * Express router to mount WorkContract-related functions on.
 * @type {object}
 * @const
 * @namespace workcontractsRouter
*/
import express, {NextFunction, Request, Response} from "express"
import Agency from "../models/Agency"
import Business from "../models/Business"
import WorkContract from "../models/WorkContract"
import authenticateToken from "../utils/auhenticateToken"
import {
  needsToBeAgency,
  bodyBusinessExists,
  needsToBeAgencyBusinessOrWorker,
  needsToBeAgencyOrBusiness,
  needsToBeWorker,
  needsToBeBusiness} from "../utils/middleware"
import { buildPaginatedObjectFromArray, deleteTracesOfFailedWorkContract } from "../utils/common"
import {
  IAgencyDocument,
  IBusinessContractDocument,
  IBusinessDocument,
  ISubContractDocument,
  IWorkContractDocument
} from "../objecttypes/modelTypes"
import BusinessContract from "../models/BusinessContract"
import {IBaseBody, IBodyWithIds, IRemovedTraces} from "../objecttypes/otherTypes"
import {CallbackError, DocumentDefinition, Types} from "mongoose"
import {ParamsDictionary} from "express-serve-static-core"
import {
  acceptWorkContract, acceptWorkers,
  addTraceToWorker,
  addWorkerToWorkContract, checkUserInWorkContract, declineWorkers,
  newContractToWorkContract, workContractExists, revertWorkers, updateWorkContract, workContractIncludesUser
} from "../utils/workContractMiddleware";
const workcontractsRouter = express.Router()

const domainUrl = "http://localhost:8000/"
const workContractsApiPath = "workcontracts/"

/**
 * @openapi
 * /workcontracts/{contractId}:
 *   get:
 *     summary: Route for getting one specific work contract
 *     description: Requires user logged in as a participant of this specific work contract.
 *     tags: [WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *     responses:
 *       "200":
 *         description: Returns the full work contract document if logged in as an agency or a business. If logged in as a worker, returns the only the contract they are in, i.e. the subcontract.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: "#/components/schemas/WorkContract"
 *                 - $ref: "#/components/schemas/SubContract"
 *       "403":
 *         description: Not allowed to view a work contract user is not a part of.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: User who is trying to use this route is not in the work contract
*/
workcontractsRouter.get("/:contractId", authenticateToken, needsToBeAgencyBusinessOrWorker, workContractExists, workContractIncludesUser,
(req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    if (body.userInWorkContract === true) {
      if (body.agency !== undefined) {
        return res.status(200).send(body.workContract)
      }
      else if (body.business !== undefined) { //WORKS BUT NOT THE BEST
        body.workContract?.contracts.forEach(contract => {
          contract.requestWorkers = []
        });
        return res.status(200).send(body.workContract)
      }
      else if (body.worker !== undefined) { //WORKS BUT NOT THE BEST
        let contract: ISubContractDocument | undefined
        body.worker.workContracts.some(id => {
          return contract = body.workContract?.contracts.find( contract => contract._id = id)
        })
        return res.status(200).send(contract)
      }
    } else {
      return res.status(403).send({ message: "User who is trying to use this route is not in the work contract" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /workcontracts:
 *   get:
 *     summary: Route for getting all of the user's work contracts
 *     tags: [WorkContract]
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
 *         description: Returns all of the user's work contracts, paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedWorkContract"
 *       "401":
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Token didn't have any users.
 *       "404":
 *         description: User has no work contracts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Couldn't find any WorkContracts
 *       "500":
 *         description: An error occurred when calling database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
workcontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query, body } = req
  try {
    //Initialise page, limit, myId, model
    let page: number = parseInt(query.page as string, 10)
    let limit: number = parseInt(query.limit as string, 10)
    let array: {}
    let projection = {}
    //Check that page and limit exist and are not bellow 1
    if (page < 1 || !page) {
      page = 1
    }
    if (limit < 1 || !limit) {
      limit = 1
    }
    //Which id is in question
    if (body.agency) {
      array = {_id: {$in: body.agency.workContracts}}
    }
    else if (body.business) {
      array = {_id: {$in: body.business.workContracts}}
      projection = { 'contracts': { 'requestWorkers': 0 } }
    }
    else if (body.worker) {
      array =  {'contracts._id': {$in: body.worker.workContracts}}
      projection = 'contracts.$'
    }
    else {
      return res.status(401).send({ message: "Token didn't have any users." })
    }
    return await WorkContract.find(array,
      projection,
      { lean: true },
      (error: CallbackError, result: DocumentDefinition<IWorkContractDocument>[]) => {
      if (error) {
        return res.status(500).send(error)
      } else if (result.length === 0) {
        return res.status(404).send({ message:"Couldn't find any WorkContracts" })
      } else {
        return res.status(200).send(buildPaginatedObjectFromArray(page, limit, result))
      }
    })
  } catch (exception) {
    return next(exception)
  }
})
/**
 * @openapi
 * /workcontracts:
 *   post:
 *     summary: Route for agency to make a work contract
 *     description: |
 *       Must be logged in as an agency.
 *       Agency creates a new WorkContract between a Business.
 *       The WorkContract id is then saved to lists in: Agency, Business.
 *     tags: [Agency, WorkContract]
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
 *             type: object
 *             required:
 *               - businessId
 *               - workerId
 *               - validityPeriod
 *             properties:
 *               businessId:
 *                 type: string
 *               workerId:
 *                 type: string
 *               validityPeriod:
 *                 type: string
 *                 format: date
 *               processStatus:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       "201":
 *         description: Work contract successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:
 *                   type: string
 *                   format: uri
 *             example:
 *               created: http://localhost:3001/workcontracts/6031524530c1de2568fb6606
 *       "400":
 *         description: Missing properties in request body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No business id was provided in request body
 *       "403":
 *         description: Not allowed to create a work contract if no business contract has been made.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: The logged in Agency has no BusinessContracts with Business or Agency
 *       "500":
 *         description: An error occurred when calling database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
workcontractsRouter.post("/", authenticateToken, needsToBeAgency, bodyBusinessExists, async (req: Request<unknown, unknown, IBodyWithIds>, res: Response, next: NextFunction) => {
  const { body } = req
  let businessId: Types.ObjectId
  try {
    if (!body.businessId) {
      return res.status(400).send({ message: "No business id was provided in request body" })
    }
    businessId = Types.ObjectId(body.businessId)
    const commonContractIndex: DocumentDefinition<IBusinessContractDocument>[] = await BusinessContract.find(
      { agency: res.locals.decoded.id, 'madeContracts.businesses': { $elemMatch: { 'businessId':businessId } } },
      undefined,
      { lean: true })
    //checkAgencyBusinessContracts function checks commonContractIndex
    if (commonContractIndex.length !== 1) {
      return res.status(403).json({ message: "The logged in Agency has no BusinessContracts with Business or Agency" }).end()
    }
    //Initialize workContracts fields
    let createFields = {
      business: businessId,
      agency: res.locals.decoded.id,
      contracts: []
    }
    const contractToCreate: IWorkContractDocument = new WorkContract(createFields)
    //Next add traces to Business and Agency
    await Business.findOneAndUpdate(
      { _id: businessId },
      { $addToSet: { workContracts: contractToCreate._id } },
      { lean: true },
      async (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
        if (error || !result) {
          return res // TODO this only returns from the callback, not from the whole function.
            .status(500)
            .send({ error, message: "Could not add WorkContract to Business  with ID" + body.businessId + ". No WorkContract created." })
        }
        return result
    })
    await Agency.findOneAndUpdate(
      { _id: res.locals.decoded.id },
      { $addToSet: { workContracts: contractToCreate._id } },
      { lean: true },
      async (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
      if (error || !result) {
        await deleteTracesOfFailedWorkContract(null, (body.businessId as string), res.locals.decoded.id, contractToCreate._id.toString(),
          (result: IRemovedTraces) => {
            if (result.businessTraceRemoved && result.agencyTraceRemoved) {
              return res // TODO As with above, this only returns from the callback, not from the whole function.
                .status(500)
                .send({ error,
                  message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created but references were deleted." })
            } else {
              return res
                .status(500)
                .send({ error,
                  message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created and references were not deleted." })
            }
          })
      }
      return result
    })
    //Next check that workContract doesn't already exist
    let contract: IWorkContractDocument | null
    const commonWorkContractArray: DocumentDefinition<IWorkContractDocument>[] = await WorkContract.find(
      { business:  businessId, agency:  res.locals.decoded.id },
      undefined,
      { lean: true }
    )
    if (commonWorkContractArray[0]) {
      contract = null
    } else {
      contract = await contractToCreate.save()
    }
    //If contract already exists deleteTraces, if not return res url.
    if (!contract) {
      await deleteTracesOfFailedWorkContract(null, body.businessId, res.locals.decoded.id, contractToCreate._id.toString(),
        (result: IRemovedTraces) => {
          if (result.businessTraceRemoved && result.agencyTraceRemoved) {
            return res
              .status(500)
              .send({ message: "Could not make WorkContract because agency and business already have WorkContract. No WorkContract created but references were deleted." })
          } else {
            return res
              .status(500)
              .send({ message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract already exist" })
          }
        })
    } else {
      return res
        .status(201)
        .send({ created: domainUrl + workContractsApiPath + contract._id })
    }
  } catch (exception) {
    next(exception)
  }
})
/**
 * @openapi
 * /workcontracts/{contractId}/new:
 *   put:
 *     summary: Route used by Business to make a new contract
 *     description: |
 *       Must be logged in as a business.
 *       Requires that business has made a business contract with agency.
 *     tags: [Business, WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract between business and agency.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # TODO
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
workcontractsRouter.put("/:contractId/new", authenticateToken, needsToBeBusiness, workContractExists, workContractIncludesUser, checkUserInWorkContract,
  newContractToWorkContract, updateWorkContract)
/**
 * @openapi
 * /workcontracts/{contractId}/{contractsId}/add:
 *   put:
 *     summary: Route used to add worker to contract's workers array list
 *     description: Must be logged in as a worker.
 *     tags: [Worker, WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *       - in: path
 *         name: contractsId
 *         description: ID of the specific work contract between agency/business and worker.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6660
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
workcontractsRouter.put("/:contractId/:contractsId/add", authenticateToken, needsToBeWorker,  workContractExists,
  addWorkerToWorkContract, addTraceToWorker, updateWorkContract)
/**
 * Route is used by Business and Agency to accept contract
 * that Business has created.
 * @openapi
 * /workcontracts/{contractId}/{contractsId}/accept:
 *   put:
 *     summary: Route used by business and agency to accept contract that business has created
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *       - in: path
 *         name: contractsId
 *         description: ID of the specific work contract between agency/business and worker.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6660
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
workcontractsRouter.put("/:contractId/:contractsId/accept", authenticateToken, needsToBeAgencyOrBusiness, workContractExists, workContractIncludesUser, checkUserInWorkContract,
  acceptWorkContract, updateWorkContract)
/**
 * @openapi
 * /workcontracts/{contractId}/{contractsId}/acceptWorkers:
 *   put:
 *     summary: Route is used by agency to accept workers who have sent a request to the contract
 *     description: |
 *       Must be logged in as an agency.
 *       Accepted workers are moved from the requestWorkers array to the acceptedWorkers array.
 *     tags: [Agency, WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *       - in: path
 *         name: contractsId
 *         description: ID of the specific work contract between agency/business and worker.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6660
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # TODO
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
workcontractsRouter.put("/:contractId/:contractsId/acceptWorkers", authenticateToken, needsToBeAgency, workContractExists, workContractIncludesUser, checkUserInWorkContract,
acceptWorkers, updateWorkContract)
/**
 * @openapi
 * /workcontracts/{contractId}/{contractsId}/revertWorkers:
 *   put:
 *     summary: Route is used by agency to revert workers who have been accepted to the contract
 *     description: |
 *       Must be logged in as an agency.
 *       Reverted workers are moved from the acceptedWorkers array to the requestWorkers array.
 *     tags: [Agency, WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *       - in: path
 *         name: contractsId
 *         description: ID of the specific work contract between agency/business and worker.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6660
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # TODO
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
workcontractsRouter.put("/:contractId/:contractsId/revertWorkers", authenticateToken, needsToBeAgency, workContractExists, workContractIncludesUser, checkUserInWorkContract,
revertWorkers, updateWorkContract)
/**
 * @openapi
 * /workcontracts/{contractId}/{contractsId}/declineWorkers:
 *   put:
 *     summary: Route is used by agency or business to remove workers who have been accepted or have sent a request to the contract
 *     description: |
 *       Must be logged in as an agency or a business.
 *       Removed workers can be removed from both requestWorkers and acceptedWorkers arrays.
 *     tags: [Agency, Business, WorkContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: contractId
 *         description: ID of the work contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6606
 *       - in: path
 *         name: contractsId
 *         description: ID of the specific work contract between agency/business and worker.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6031524530c1de2568fb6660
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # TODO
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
workcontractsRouter.put("/:contractId/:contractsId/declineWorkers",authenticateToken, needsToBeAgencyOrBusiness, workContractExists, workContractIncludesUser, checkUserInWorkContract,
declineWorkers, updateWorkContract)

/**
 * TODO (TULEVAISUUDESSA: route jolla voi poistaa contract objectin WorkContractista. <TÄMÄN ROUTEN TÄYTYY POISTAA KAIKKI YHTEYDET TYÖNTEKIJÖILTÄ JOTKA OVAT TÄSSÄ>)
 */

/**
 * @deprecated
 * Route for agency to delete workcontract. For this route to work, user must be logged in as a agency and workcontract must exist.
 * Body must include contractId. Example { "contractId": "workcontractid" }.
 * FOR FUTURE: USER TRACES MUST BE DELETED.
 */
workcontractsRouter.delete("/:contractId",
authenticateToken,
needsToBeAgency,
workContractExists,
workContractIncludesUser,
async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req

  if (body.userInWorkContract !== true || !body.workContract)
    return res.status(401).send( { message: "This route is only available to Agency who is in this contract." })
  try {
    await deleteTracesOfFailedWorkContract(
      null,
      (body.workContract.business as Types.ObjectId).toString(),
      (body.workContract.agency as Types.ObjectId).toString(),
      params.contractId,
      async (result: IRemovedTraces) => {
        if (result.businessTraceRemoved === true && result.agencyTraceRemoved === true) {
          return WorkContract.findByIdAndDelete(
            body.workContract?._id,
            { lean: true },
            (error: CallbackError, result: DocumentDefinition<IWorkContractDocument> | null) => {
              if (error) {
                return res.status(500).json({
                  message:
                    "Deleted references to WorkContract with ID " +
                    body.workContract?._id +
                    " but could not remove the contract itself. Possible error: " +
                    error
                })
              } else if (!result) {
                return res.status(500).json({ message: "Didn't receive a result from database whilst deleting WorkContract" })
              } else {
                return res.status(204).send()
              }
            }
          )
        } else {
          return res.status(406).json({
            message:
             "Couldn't delete references of this WorkContract"+
             ", WorkerTraceRemoved: "+result.workerTraceRemoved+
             ", businessTraceRemoved: "+result.businessTraceRemoved+
             ", agencyTraceRemoved: "+result.agencyTraceRemoved
          })
        }
      })
  } catch (exception) {
    return next(exception)
  }
})
export default workcontractsRouter