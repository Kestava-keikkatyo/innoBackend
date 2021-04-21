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
import express from "express"
import { body as _body } from "express-validator"
import Agency from "../models/Agency"
import Business from "../models/Business"
import WorkContract from "../models/WorkContract"
import authenticateToken from "../utils/auhenticateToken"
import {
  needsToBeAgency,
  bodyBusinessExists,
  needsToBeAgencyBusinessOrWorker,
  workContractIncludesUser,
  updateWorkContract,
  newContractToWorkContract,
  checkUserInWorkContract,
  needsToBeAgencyOrBusiness,
  needsToBeWorker,
  acceptWorkContract,
  addWorkerToWorkContract,
  needsToBeBusiness,
  addTraceToWorker,
  acceptWorkers,
  revertWorkers,
  declineWorkers,
  pathWorkContractExists} from "../utils/middleware"
import { buildPaginatedObjectFromArray, deleteTracesOfFailedWorkContract } from "../utils/common"
import { IWorkContractDocument } from "../objecttypes/modelTypes"
import BusinessContract from "../models/BusinessContract"
const workcontractsRouter = express.Router()

const domainUrl = "http://localhost:8000/"
const workContractsApiPath = "workcontracts/"

/**
 * TODO:THIS ROUTE DOESNT WORK RIGHT
 * Route is used to get one users workContract with :contractId
 * Requires that the logged in user is authored to see this contract.
 * @name GET /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgencyBusinessOrWorker - Checks if the logged in user is Agency, Business or Worker.
 * <pre>Full description: {@link needsToBeAgencyBusinessOrWorker}</pre>
 * @param {callback} pathWorkContractExists - Checks if a WorkContract with url param :contractId exists.
 * <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks if user who is using route is in workcontract.
 * <pre>Full description: {@link workContractIncludesUser}</pre>
 * @throws {JSON} Status 400 - res.body: { message: "User who is trying to use this route is not in workcontract" }
 * @returns {JSON} Status 200 - res.body: { The found WorkContract object }
*/
workcontractsRouter.get("/:contractId", authenticateToken, needsToBeAgencyBusinessOrWorker, pathWorkContractExists, workContractIncludesUser, (req, res, next) => {
  const { body } = req
  try {
    if (body.userInWorkContract === true) {
      return res.status(200).send(body.workContract)
    } else {
      return res.status(400).send({ message:"User who is trying to use this route is not in workcontract" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route is used to get all users workContracts. Uses authenticate token to parse users id.
 * Id is used to get all users workContracts.
 * Requires that logged in user is agency, business or worker.
 * @name GET /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgencyBusinessOrWorker - Checks if the logged in user is Agency, Business or Worker.
 * <pre>Full description: {@link needsToBeAgencyBusinessOrWorker}</pre>
 * @throws {JSON} Status 400 - res.body: { message: "Missing or incorrect page parameter" }
 * @throws {JSON} Status 400 - res.body: { message: "Missing or incorrect limit parameter" }
 * @throws {JSON} Status 404 - res.body: { message: "Couldn't find any workcontracts" }
 * @returns {JSON} Status 200 - res.body: { All users WorkContract objects }
 */
workcontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req, res, next) => {
  const { query, body } = req
  try {
    //Initialise page,limit,myId,model
    let page: number = parseInt(query.page as string, 10)
    let limit: number = parseInt(query.limit as string, 10)
    let array: {}
    let projection = {}
    //Check that page and limit exist and are not bellow 1
    if (page < 1 || !page) {
      page == 1
    }
    if (limit < 1 || !limit) {
      limit == 1
    }
    //Which id is in question
    if (body.agency !== undefined) {
      array = {_id: {$in: body.agency.workContracts}}
    }
    else if (body.business !== undefined) {
      array = {_id: {$in: body.business.workContracts}}
      projection = { 'contracts': { 'requestWorkers': 0 } }
    }
    else if (body.worker !== undefined) {
      array =  {'contracts._id': {$in: body.worker.workContracts}}
      projection = 'contracts.$'
    }
    else {
      return res.status(400).send({ message:"Token didn't have any users." })
    }
    return await WorkContract.find(array,projection,null,(err,result) => {
      if (err || !result) {
        return res.status(404).send(err || { message:"Couldn't find any workcontracts" })
      } else {
        return res.status(200).send(buildPaginatedObjectFromArray(page,limit,result))
      }
    })
  } catch (exception) {
    return next(exception)
  }
})
/**
 * Route for Agency to make workContract.
 * Agency creates a new WorkContract between a Business and a Worker.
 * The WorkContract id is then saved to lists in: Worker, Agency, Business.
 * Requires User logged in as Agency. req.body MANDATORY: { businessId: "businessId", workerId: "workerId", validityPeriod: "valid end date" }.
 * req.body OPTIONAL: { processStatus: "integer" } has a default of "1".
 * @example { created: http://localhost:8080/api/workcontracts/2lkdfrakws9a9vcsv}
 * @name POST /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks if the logged in user is an Agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} bodyBusinessExists - Checks if a Business with req.body.businessId exists.
 * <pre>Full description: {@link bodyBusinessExists}</pre>
 * @param {callback} bodyWorkerExists - Checks if a Worker with req.body.workerId exists.
 * <pre>Full description: {@link bodyWorkerExists}</pre>
 * @param {callback} checkAgencyBusinessContracts - Used to go through agency businessContracts and check if correct Business and Worker are found.
 * <pre>Full description: {@link checkAgencyBusinessContracts}</pre>
 * @throws {JSON} Status 400 - res.body: { message: "The logged in Agency has no BusinessContracts with Business or Agency" }
 * @throws {JSON} Status 400 - res.body: { message: "The logged in Agency has BusinessContract with Business or Worker but not for both" }
 * @throws {JSON} Status 400 - res.body: { error,
 * message: "Could not add WorkContract to Business  with ID" + req.body.businessId + ". No WorkContract created." }
 * @throws {JSON} Status 400 - res.body: { error,
 * message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created but references were deleted." }
 * @throws {JSON} Status 400 - res.body: { error,
 * message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created and references were not deleted."  }
 * @throws {JSON} Status 400 - reponse.body: {
 * message: "Could not make WorkContract because agency and business allready have WorkContract. No WorkContract created but references were deleted." }
 * @throws {JSON} Status 400 - reponse.body: {
 * message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract allready exist"}
 * @returns {JSON} Status 201 - res.body: { created: domainUrl + workContractsApiPath + contract._id }
 */
workcontractsRouter.post("/", authenticateToken, needsToBeAgency, bodyBusinessExists, async (req, res, next) => {
  const { body } = req
  try {
    const commonContractIndex = await BusinessContract.find(
      { agency: res.locals.decoded.id, 'madeContracts.businesses': body.businessId })
    //checkAgencyBusinessContracts function checks commonContractIndex
    if (commonContractIndex.length !== 1) {
      return res.status(400).json({ message: "The logged in Agency has no BusinessContracts with Business or Agency" }).end()
    }
    //Initialize workontracts fields
    let createFields = {
      business: body.businessId,
      agency: res.locals.decoded.id,
      contracts: []
    }
    const contractToCreate: IWorkContractDocument = new WorkContract(createFields)
    //Next add traces to Business and Agency
    await Business.findOneAndUpdate(
      { _id: body.businessId },
      { $addToSet: { workContracts: contractToCreate._id } },
      { lean: true },
      async (error: Error, result: any) => {
        if (error || !result) {
          return res
            .status(400)
            .send({ error, message: "Could not add WorkContract to Business  with ID" + body.businessId + ". No WorkContract created." })
        }
        return result
    })
    await Agency.findOneAndUpdate(
      { _id: res.locals.decoded.id },
      { $addToSet: { workContracts: contractToCreate._id } },
      { lean: true },
      async (error: Error, result: any) => {
      if (error || !result) {
        await deleteTracesOfFailedWorkContract(null, body.businessId, res.locals.decoded.id, contractToCreate._id.toString(),
          (result: any) => {
            if (result.businessTraceRemoved && result.agencyTraceRemoved) {
              return res
                .status(400)
                .send({ error,
                  message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created but references were deleted." })
            } else {
              return res
                .status(400)
                .send({ error,
                  message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created and references were not deleted." })
            }
          })
      }
      return result
    })
    //Next check that workContract doesn't allready exist
    let contract = undefined
    const commonWorkContractArray = await WorkContract.find({
      business:  body.businessId,
      agency:  res.locals.decoded.id
    })
    if (commonWorkContractArray[0]) {
      contract = null
    } else {
      contract = await contractToCreate.save()
    }
    //If contract allready exist deleteTraces, if not return res url.
    if (!contract) {
      await deleteTracesOfFailedWorkContract(null, body.businessId, res.locals.decoded.id, contractToCreate._id.toString(),
        (result: any) => {
          if (result.businessTraceRemoved && result.agencyTraceRemoved) {
            return res
              .status(400)
              .send({ message: "Could not make WorkContract because agency and business allready have WorkContract. No WorkContract created but references were deleted." })
          } else {
            return res
              .status(400)
              .send({ message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract allready exist" })
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
 * Route used by Business to make new contract.
 * Requires that Business has made BusinessContract with agency.
 * @name PUT /workcontracts/:contractId/new
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeBusiness - Checks if the logged in user is Business. <pre>Full description: {@link needsToBeBusiness}</pre>
 * @param {callback} pathWorkContractExists - Checks if a WorkContract with url param :contractId exists. <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks if user who is using route is in workcontract. <pre>Full description: {@link workContractIncludesUser}</pre>
 * @param {callback} checkUserInWorkContract - Checks workContractIncludesUser functions result. <pre>Full description: {@link checkUserInWorkContract}</pre>
 * @param {callback} updateWorkContract - Updates workContract object with given req.params.contractId in database. <pre>Full description: {@link updateWorkContract}</pre>
 * @returns {JSON} Status 200 - res.body: { The updated workcontract object }
 */
workcontractsRouter.put("/:contractId/new", authenticateToken, needsToBeBusiness, pathWorkContractExists, workContractIncludesUser, checkUserInWorkContract,
  newContractToWorkContract, updateWorkContract)
/**
 * Route used to add worker to contract workers array list.
 * @name PUT /workcontracts/:contractId/:contractsId/add
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token. <pre>Full description: {@link authenticateToken}</pre>
 * @param {callback} needsToBeWorker - Checks that user is worker. <pre>Full description: {@link needsToBeWorker}</pre>
 * @param {callback} pathWorkContractExists - Checks that WorkContract with :contractId exist. <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} addWorkerToWorkContract - Initializes update fields (adds worker to list). <pre>Full description: {@link addWorkerToWorkContract}</pre>
 * @param {callback} updateWorkContract - Updates WorkContract in database. <pre>Full description: {@link updateWorkContract}</pre>
 */
workcontractsRouter.put("/:contractId/:contractsId/add", authenticateToken, needsToBeWorker,  pathWorkContractExists,
  addWorkerToWorkContract, addTraceToWorker, updateWorkContract)
/**
 * Route is used by Business and Agency to accept contract
 * that Business has created.
 * @name PUT /workcontracts/:contractId/:contractsId/accept
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgencyOrBusiness - Checks that user is Agency or Business. <pre>Full description: {@link needsToBeAgencyOrBusiness}</pre>
 * @param {callback} pathWorkContractExists - Checks that WorkContract with :contractId exist. <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks that WorkContract includes user. <pre>Full description: {@link workContractIncludesUser}</pre>
 * @param {callback} checkUserInWorkContract - Checks workContractIncludesUser functions result. <pre>Full description: {@link checkUserInWorkContract}</pre>
 * @param {callback} acceptWorkContract - Initializes accept update fields. <pre>Full description: {@link acceptWorkContract}</pre>
 * @param {callback} updateWorkContract - Updates WorkContract in database. <pre>Full description: {@link updateWorkContract}</pre>
 */
workcontractsRouter.put("/:contractId/:contractsId/accept", authenticateToken, needsToBeAgencyOrBusiness, pathWorkContractExists, workContractIncludesUser, checkUserInWorkContract,
  acceptWorkContract, updateWorkContract)
/**
 * Route is used by Agency to accept workers who have send request to the contract.
 * Accepted workers are moved from requestWorkers array to acceptedWorkers array.
 * @name PUT /workcontracts/:contractId/:contractsId/acceptWorkers
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks that user is Agency. <pre> Full description: {@link needsToBeAgency}</pre>
 * @param {callback} pathWorkContractExists - Checks that WorkContract with :contractId exist. <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks that WorkContract includes user. <pre>Full description: {@link workContractIncludesUser}</pre>
 * @param {callback} checkUserInWorkContract - Checks workContractIncludesUser functions result. <pre>Full description: {@link checkUserInWorkContract}</pre>
 * @param {callback} acceptWorkers - Initializes update that moves selected workers from requestWorkers array to acceptWorkers array. <pre>Full description:{@link acceptWorkers}</pre>
 * @param {callback} updateWorkContract - Updates WorkContract in database. <pre>Full description: {@link updateWorkContract}</pre>
 */
workcontractsRouter.put("/:contractId/:contractsId/acceptWorkers",authenticateToken,needsToBeAgency,pathWorkContractExists,workContractIncludesUser,checkUserInWorkContract,
acceptWorkers, updateWorkContract)  
/**
 * Route is used by Agency to revert workers who have been accepted to the contract.
 * Reverted workers are moved from acceptedWorkers array to requestWorkers array. 
 * @name PUT /workcontracts/:contractId/:contractsId/revertWorkers
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks that user is Agency. <pre> Full description: {@link needsToBeAgency}</pre>
 * @param {callback} pathWorkContractExists - Checks that WorkContract with :contractId exist. <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks that WorkContract includes user. <pre>Full description: {@link workContractIncludesUser}</pre>
 * @param {callback} checkUserInWorkContract - Checks workContractIncludesUser functions result. <pre>Full description: {@link checkUserInWorkContract}</pre>
 * @param {callback} revertWorkers - Initializes update that moves selected workers from acceptWorkers array to requestWorkers array. <pre>Full description:{@link revertWorkers}</pre>
 * @param {callback} updateWorkContract - Updates WorkContract in database. <pre>Full description: {@link updateWorkContract}</pre>
 */
workcontractsRouter.put("/:contractId/:contractsId/revertWorkers",authenticateToken,needsToBeAgency,pathWorkContractExists,workContractIncludesUser,checkUserInWorkContract,
revertWorkers, updateWorkContract)
/**
 * Route is used by Agency or Business to remove workers who have been accepted or have send request to the contract.
 * Removed workers can be removed from both requestWorkers and acceptedWorkers array.
 * @name PUT /workcontracts/:contractId/:contractsId/revertWorkers
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks that user is Agency. <pre> Full description: {@link needsToBeAgency}</pre>
 * @param {callback} pathWorkContractExists - Checks that WorkContract with :contractId exist. <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks that WorkContract includes user. <pre>Full description: {@link workContractIncludesUser}</pre>
 * @param {callback} checkUserInWorkContract - Checks workContractIncludesUser functions result. <pre>Full description: {@link checkUserInWorkContract}</pre>
 * @param {callback} declineWorkers - Initializes update that removes selected workers from acceptWorkers array and requestWorkers array. <pre>Full description:{@link declineWorkers}</pre>
 * @param {callback} updateWorkContract - Updates WorkContract in database. <pre>Full description: {@link updateWorkContract}</pre>
 */
workcontractsRouter.put("/:contractId/:contractsId/declineWorkers",authenticateToken,needsToBeAgencyOrBusiness,pathWorkContractExists,workContractIncludesUser,checkUserInWorkContract,
declineWorkers, updateWorkContract)

/**
 * (TULEVAISUUDESSA: route jolla voi poistaa contract objectin WorkContractista. <TÄMÄN ROUTEN TÄYTYY POISTAA KAIKKI YHTEYDET TYÖNTEKIJÖILTÄ JOTKA OVAT TÄSSÄ>)
 */

/**
 * @deprecated
 * Route for agency to delete workcontract. For this route to work, user must be logged in as a agency and workcontract must exist.
 * Body must include contractId. Example { "contractId": "workcontractid" }.
 * FOR FUTURE: USER TRACES MUST BE DELETED.
 * @name DELETE /workcontracts/:contractId
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks if the logged in user is an Agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} pathWorkContractExists - Checks if a WorkContract with url param :contractId exists.
 * <pre>Full description: {@link pathWorkContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks if user who is using route is in workcontract.
 * <pre>Full description: {@link workContractIncludesUser}</pre>
 * @throws {JSON} Status 401 - res.body: { message: "This route is only available to Agency who is in this contract." }
 * @throws {JSON} Status 400 - res.body: { message: "Deleted references to WorkContract with ID " + req.workContract._id +
                    "but could not remove the contract itself. Possible error: " +
                    error, }
 * @throws {JSON} Status 406 - res.body: { message: "Couldn't delete references of this WorkContract"+
             ", WorkerTraceRemoved: "+result.workerTraceRemoved+
             ", businessTraceRemoved: "+result.businessTraceRemoved+
             ", agencyTraceRemoved: "+result.agencyTraceRemoved}
 * @returns {JSON} Status 200 - res.body: { The deleted WorkContract object }
 */
workcontractsRouter.delete("/:contractId",
authenticateToken,
needsToBeAgency,
pathWorkContractExists,
workContractIncludesUser,
async (req, res, next) => {
  const { body, params } = req

  if (body.userInWorkContract !== true || !body.workContract)
    return res.status(401).send( { message: "This route is only available to Agency who is in this contract." })
  try {
    await deleteTracesOfFailedWorkContract(
      null,
      body.workContract.business.toString(),
      body.workContract.agency.toString(),
      params.contractId,
      async (result: any) => {
        if (result.businessTraceRemoved === true && result.agencyTraceRemoved === true) {
          return WorkContract.findByIdAndDelete(
            body.workContract._id,
            undefined,
            (error: Error, result: any) => {
              if (error || !result) {
                return res.status(400).json({
                  message:
                    "Deleted references to WorkContract with ID " +
                    body.workContract._id +
                    " but could not remove the contract itself. Possible error: " +
                    error,
                })
              } else {
                return res.status(204).send()
              }
            }
          );
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