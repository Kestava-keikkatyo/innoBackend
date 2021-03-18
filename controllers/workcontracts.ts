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
import { body } from "express-validator"
import Agency from "../models/Agency"
import Business from "../models/Business"
import WorkContract from "../models/WorkContract"
import User from "../models/User"
import authenticateToken from "../utils/auhenticateToken"
import { 
  needsToBeAgency, 
  bodyBusinessExists,
  workContractExists,
  needsToBeAgencyBusinessOrWorker,
  workContractIncludesUser,
  bodyWorkerExists,
  checkAgencyBusinessContracts } from "../utils/middleware"
import { deleteTracesOfFailedWorkContract } from "../utils/common"
const workcontractsRouter = express.Router() 

const domainUrl = "http://localhost:8000/"
const workContractsApiPath = "workcontracts/"

/**
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
 * @param {callback} workContractExists - Checks if a WorkContract with url param :contractId exists.
 * <pre>Full description: {@link workContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks if user who is using route is in workcontract.
 * <pre>Full description: {@link workContractIncludesUser}</pre>
 * @throws {JSON} Status 400 - response.body: { message: "User who is trying to use this route is not in workcontract" }
 * @returns {JSON} Status 200 - response.body: { The found WorkContract object }
*/
workcontractsRouter.get("/:contractId", authenticateToken, needsToBeAgencyBusinessOrWorker, workContractExists, workContractIncludesUser, (request, response, next) => {
  try {
    if (request.userInWorkContract === true) {
      return response.status(200).send(request.workContract)
    } else {
      return response.status(400).send({ message:"User who is trying to use this route is not in workcontract" })
    }
  } catch (exception) {
    next(exception)
    return response.status(500).send({ message:"OOPS SERVER ISSUE" })
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
 * @throws {JSON} Status 400 - response.body: { message:"Token didn't have any users." }
 * @returns {JSON} Status 200 - response.body: { All users WorkContract objects }
 */
workcontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (request, response, next) => {
  try {
    //Initialise page,limit,myId,model
    const page = request.query.page
    const limit = request.query.limit
    let myId = null
    let model = null
    //Check that page and limit exist and are not bellow 1
    if (page < 1 || !page) {
      return response.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return response.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    //Which id is in question
    if (request.agency !== undefined) {
      myId = request.agency.id
      model = Agency
    }
    else if (request.business !== undefined) {
      myId = request.business.id
      model = Business
    }
    else if (request.worker !== undefined) {
      myId = request.worker.id
      model = User
    }
    else {
      return response.status(400).send({ message:"Token didn't have any users." })
    }
    //Do the pagination
    model.paginate({ _id: { $in: myId } },
      { projection:"workContracts", populate: {path:"workContracts", model: "WorkContract", page: page, limit: limit} },
      (error:Error, result:any) => {
        if (error || !result) {
          response.status(500).send( error.message || { message: "Did not receive a result from database." })
        } else {
          if (result.docs.length === 0) {
            return response.status(404).send( { message: "Could not find any WorkContracts." })
          }
          response.status(200).json(result)
        }
      })
  } catch (exception) {
    next(exception)
  }
})

/**
 * Route for Agency to make workContract.
 * Agency creates a new WorkContract between a Business and a Worker.
 * The WorkContract id is then saved to lists in: Worker, Agency, Business.
 * Requires User logged in as Agency. request.body MANDATORY: { businessId: "businessId", workerId: "workerId", validityPeriod: "valid end date" }.
 * request.body OPTIONAL: { processStatus: "integer" } has a default of "1".
 * @example { created: http://localhost:8080/api/workcontracts/2lkdfrakws9a9vcsv}
 * @name POST /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks if the logged in user is an Agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} bodyBusinessExists - Checks if a Business with request.body.businessId exists.
 * <pre>Full description: {@link bodyBusinessExists}</pre>
 * @param {callback} bodyWorkerExists - Checks if a Worker with request.body.workerId exists.
 * <pre>Full description: {@link bodyWorkerExists}</pre>
 * @param {callback} checkAgencyBusinessContracts - Used to go through agency businessContracts and check if correct Business and Worker are found.
 * <pre>Full description: {@link checkAgencyBusinessContracts}</pre>
 * @throws {JSON} Status 400 - response.body: { message: "The logged in Agency has no BusinessContracts with Business or Agency" }
 * @throws {JSON} Status 400 - response.body: { message: "The logged in Agency has BusinessContract with Business or Worker but not for both" }
 * @throws {JSON} Status 500 - response.body: { error,
 * message: "Could not add WorkContract to Business  with ID" + request.body.businessId + ". No WorkContract created." }
 * @throws {JSON} Status 500 - response.body: { error,
 * message: "Could not add WorkContract to Agency  with ID" + response.locals.decoded.id + ". No WorkContract created but references were deleted." }
 * @throws {JSON} Status 500 - response.body: { error,
 * message: "Could not add WorkContract to Agency  with ID" + response.locals.decoded.id + ". No WorkContract created and references were not deleted."  }
 * @throws {JSON} Status 500 - response.body: { error,
 * message: "Could not add WorkContract to User  with ID" + request.body.workerId + ". No WorkContract created but references were deleted."  }
 * @throws {JSON} Status 500 - response.body: { error,
 * message: "Could not add WorkContract to User  with ID" + request.body.workerId + ". No WorkContract created and references were not deleted." }
 * @throws {JSON} Status 500 - reponse.body: {
 * message: "Could not make WorkContract because agency,business and worker allready have WorkContract. No WorkContract created but references were deleted." }
 * @throws {JSON} Status 500 - reponse.body: {
 * message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract allready exist"}
 * @returns {JSON} Status 201 - response.body: { created: domainUrl + workContractsApiPath + contract._id }
 */
workcontractsRouter.post("/", authenticateToken, needsToBeAgency, bodyBusinessExists, bodyWorkerExists, checkAgencyBusinessContracts, async (request, response, next) => {
  try {
    //checkAgencyBusinessContracts function checks commonContractIndex
    if (request.commonContractIndex === -1) {
      return response.status(400).json({ message: "The logged in Agency has no BusinessContracts with Business or Agency" }).end()
    } else if (request.commonContractIndex === 0) {
      return response.status(400).json({ message: "The logged in Agency has BusinessContract with Business or Worker but not for both" })
    }
    //Initialize workcontracts fields
    let createFields = {
      business: request.body.businessId,
      user: request.body.workerId,
      agency: response.locals.decoded.id,
      validityPeriod: new Date(request.body.validityPeriod),
      processStatus: request.body.processStatus //Mihin tätä tarvitaan? Workcontractin hyväksymiseen? Täytyy lisätä workcontractiin kyseinen field
    }
    if (body.processStatus) {
      createFields.processStatus = body.processStatus
    }
    const contractToCreate = new WorkContract(createFields)
    //Next add traces to Business, Agency and Worker.
    await Business.findOneAndUpdate( { _id: request.body.businessId }, { $addToSet: { workContracts: contractToCreate._id } }, async (error, result) => {
      if (error || !result) {
        return response
          .status(500)
          .send({ error, message: "Could not add WorkContract to Business  with ID" + request.body.businessId + ". No WorkContract created." })
      }
    })
    let noErrorInDelete = null
    await Agency.findOneAndUpdate( { _id: response.locals.decoded.id }, { $addToSet: { workContracts: contractToCreate._id } }, async (error, result) => {
      if (error || !result) {
        await deleteTracesOfFailedWorkContract(null, request.body.businessId, response.locals.decoded.id, contractToCreate._id,
          (result) => {
            noErrorInDelete = result.success
          })
        if (noErrorInDelete) {
          return response
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to Agency  with ID" + response.locals.decoded.id + ". No WorkContract created but references were deleted." })
        } else {
          return response
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to Agency  with ID" + response.locals.decoded.id + ". No WorkContract created and references were not deleted." })
        }
      }
    })
    noErrorInDelete = null
    await User.findOneAndUpdate( { _id: request.body.workerId }, { $addToSet: { workContracts: contractToCreate._id } }, async (error, result) => {
      if (error || !result) {
        await deleteTracesOfFailedWorkContract(request.body.workerId, request.body.businessId, response.locals.decoded.id, contractToCreate._id,
          (result) => {
            noErrorInDelete = result.success
          })
        if (noErrorInDelete) {
          return response
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to User  with ID" + request.body.workerId + ". No WorkContract created but references were deleted." })
        } else {
          return response
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to User  with ID" + request.body.workerId + ". No WorkContract created and references were not deleted." })
        }
      }
    })
    //Next check that workContract doesn't allready exist
    let contract = undefined
    const commonWorkContractArray = await WorkContract.find({
      business:  request.body.businessId,
      user:  request.body.workerId
    })
    if (commonWorkContractArray[0]) {
      contract = null
    } else {
      contract = await contractToCreate.save()
    }
    //If contract allready exist deleteTraces, if not return response url.
    if (!contract) {
      await deleteTracesOfFailedWorkContract(request.body.workerId, request.body.businessId, response.locals.decoded.id, contractToCreate._id,
        (result) => {
          noErrorInDelete = result.success
        })
      if (noErrorInDelete) {
        return response
          .status(500)
          .send({ message: "Could not make WorkContract because agency,business and worker allready have WorkContract. No WorkContract created but references were deleted." })
      } else {
        return response
          .status(500)
          .send({ message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract allready exist" })
      }
    } else {
      return response
        .status(201)
        .send({ created: domainUrl + workContractsApiPath + contract._id })
    }
  } catch (exception) {
    next(exception)
  }
})

/**
 * Route used to update a WorkContract.
 * Requires that the logged in user is authored for this workContract.
 * Body can contain one or more of the following:
 * { businessId: "businessId", workerId: "workerId", validityPeriod: "valid end date", processStatus: "integer"}
 * @name PUT /workcontracts/:contractId
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgencyBusinessOrWorker - Checks if the logged in user is Agency, Business or Worker.
 * <pre>Full description: {@link needsToBeAgencyBusinessOrWorker}</pre>
 * @param {callback} workContractExists - Checks if a WorkContract with url param :contractId exists.
 * <pre>Full description: {@link workContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks if user who is using route is in workcontract.
 * <pre>Full description: {@link workContractIncludesUser}</pre>
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency,Business and Worker who are in this contract." }
 * @throws {JSON} Status 400 - response.body: { success: false, error: "Could not update WorkContract with id " + request.params.contractId }
 * @returns {JSON} Status 200 - response.body: { The updated workcontract object }
 */
workcontractsRouter.put("/:contractId", authenticateToken, needsToBeAgencyBusinessOrWorker, workContractExists, workContractIncludesUser, (request, response, next) => {
  // TODO: Validate the id, check that the logged in user is authored for this
  // TODO: What form the end date need to be?
  try {
    if (request.userInWorkContract !== true) {
      return response.status(401).send({ message: "This route is only available to Agency,Business and Worker who are in this contract." })
    }
    const updateFields = {
      ...request.body
    }
    WorkContract.findByIdAndUpdate(request.params.contractId, updateFields, { new: false, omitUndefined: true, runValidators: false }, (error, result) => {
      if (!result || error) {
        return response.status(400).send(error || { success: false, error: "Could not update WorkContract with id " + request.params.contractId })
      } else {
        return response.status(200).send(result)
      }
    })
  } catch (exception) {
    next(exception)
  }
})


/**
 * Route for agency to delete workcontract. For this route to work, user must be logged in as a agency and workcontract must exist.
 * Body must include contractId. Example { "contractId": "workcontractid" }
 * @name DELETE /workcontracts/:contractId
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks if the logged in user is an Agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} workContractExists - Checks if a WorkContract with url param :contractId exists.
 * <pre>Full description: {@link workContractExists}</pre>
 * @param {callback} workContractIncludesUser - Checks if user who is using route is in workcontract.
 * <pre>Full description: {@link workContractIncludesUser}</pre>
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Agency who is in this contract." }
 * @throws {JSON} Status 500 - response.body: { message: "Deleted references to WorkContract with ID " + request.workContract._id +
                    "but could not remove the contract itself. Possible error: " +
                    error, }
 * @throws {JSON} Status 500 - response.body: { message: "Couldn't delete references of this WorkContract"+
             ", WorkerTraceRemoved: "+result.workerTraceRemoved+
             ", businessTraceRemoved: "+result.businessTraceRemoved+
             ", agencyTraceRemoved: "+result.agencyTraceRemoved}
 * @returns {JSON} Status 200 - response.body: { The deleted WorkContract object }
 */
workcontractsRouter.delete("/:contractId",authenticateToken,needsToBeAgency,workContractExists,workContractIncludesUser, async (request, response, next) => {
  try {
    if (request.userInWorkContract !== true) {
      return response.status(401).send( { message: "This route is only available to Agency who is in this contract." })
    }
    deleteTracesOfFailedWorkContract(
      request.workContract.user,
      request.workContract.business,
      request.workContract.agency,
      request.params.contractId,
      async (result) => {
        if (result.workerTraceRemoved === true && result.businessTraceRemoved === true && result.agencyTraceRemoved === true) {
          await WorkContract.findByIdAndDelete(
            request.workContract._id,
            (error, result) => {
              if (error || !result) {
                return response.status(500).json({
                  message:
                    "Deleted references to WorkContract with ID " +
                    request.workContract._id +
                    " but could not remove the contract itself. Possible error: " +
                    error,
                })
              } else {
                return response.status(200).json({ result })
              }
            }
          )
        } else {
          return response.status(500).json({
            message:
             "Couldn't delete references of this WorkContract"+
             ", WorkerTraceRemoved: "+result.workerTraceRemoved+
             ", businessTraceRemoved: "+result.businessTraceRemoved+
             ", agencyTraceRemoved: "+result.agencyTraceRemoved
          })
        }
      })
  } catch (exception) {
    next(exception)
  }
})
module.exports = workcontractsRouter