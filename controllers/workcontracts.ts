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
 * @throws {JSON} Status 400 - res.body: { message: "User who is trying to use this route is not in workcontract" }
 * @returns {JSON} Status 200 - res.body: { The found WorkContract object }
*/
workcontractsRouter.get("/:contractId", authenticateToken, needsToBeAgencyBusinessOrWorker, workContractExists, workContractIncludesUser, (req, res, next) => {
  
  try {
    if (req.body.userInWorkContract === true) {
      return res.status(200).send(req.body.workContract)
    } else {
      return res.status(400).send({ message:"User who is trying to use this route is not in workcontract" })
    }
  } catch (exception) {
    next(exception)
    return res.status(500).send({ message:"OOPS SERVER ISSUE" })
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
 * @throws {JSON} Status 400 - res.body: { message:"Token didn't have any users." }
 * @returns {JSON} Status 200 - res.body: { All users WorkContract objects }
 */
workcontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req, res, next) => {
  const { query, body } = req
  try {
    //Initialise page,limit,myId,model
    const page: any = query.page
    const limit: any = query.limit
    let myId = null
    let model: any = null
    //Check that page and limit exist and are not bellow 1
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    //Which id is in question
    if (body.agency !== undefined) {
      myId = body.agency.id
      model = Agency
    }
    else if (body.business !== undefined) {
      myId = body.business.id
      model = Business
    }
    else if (body.worker !== undefined) {
      myId = body.worker.id
      model = User
    }
    else {
      return res.status(400).send({ message:"Token didn't have any users." })
    }
    //Do the pagination
    // TODO: proper type checking 
    model.paginate({ _id: { $in: myId } },
      { projection:"workContracts", populate: {path:"workContracts", model: "WorkContract", page: page, limit: limit} },
      (error:Error, result:any) => {
        if (error || !result) {
          return res.status(500).send( error.message || { message: "Did not receive a result from database." })
        } else {
          if (result.docs.length === 0) {
            return res.status(404).send( { message: "Could not find any WorkContracts." })
          }
          return res.status(200).json(result)
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
 * @throws {JSON} Status 500 - res.body: { error,
 * message: "Could not add WorkContract to Business  with ID" + req.body.businessId + ". No WorkContract created." }
 * @throws {JSON} Status 500 - res.body: { error,
 * message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created but references were deleted." }
 * @throws {JSON} Status 500 - res.body: { error,
 * message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created and references were not deleted."  }
 * @throws {JSON} Status 500 - res.body: { error,
 * message: "Could not add WorkContract to User  with ID" + req.body.workerId + ". No WorkContract created but references were deleted."  }
 * @throws {JSON} Status 500 - res.body: { error,
 * message: "Could not add WorkContract to User  with ID" + req.body.workerId + ". No WorkContract created and references were not deleted." }
 * @throws {JSON} Status 500 - reponse.body: {
 * message: "Could not make WorkContract because agency,business and worker allready have WorkContract. No WorkContract created but references were deleted." }
 * @throws {JSON} Status 500 - reponse.body: {
 * message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract allready exist"}
 * @returns {JSON} Status 201 - res.body: { created: domainUrl + workContractsApiPath + contract._id }
 */
workcontractsRouter.post("/", authenticateToken, needsToBeAgency, bodyBusinessExists, bodyWorkerExists, checkAgencyBusinessContracts, async (req, res, next) => {
  const { body } = req
  try {
    //checkAgencyBusinessContracts function checks commonContractIndex
    if (body.commonContractIndex === -1) {
      return res.status(400).json({ message: "The logged in Agency has no BusinessContracts with Business or Agency" }).end()
    } else if (body.commonContractIndex === 0) {
      return res.status(400).json({ message: "The logged in Agency has BusinessContract with Business or Worker but not for both" })
    }
    //Initialize workcontracts fields
    let createFields = {
      business: body.businessId,
      user: body.workerId,
      agency: res.locals.decoded.id,
      validityPeriod: new Date(body.validityPeriod),
      processStatus: body.processStatus //Mihin tätä tarvitaan? Workcontractin hyväksymiseen? Täytyy lisätä workcontractiin kyseinen field
    }
    const contractToCreate = new WorkContract(createFields)
    //Next add traces to Business, Agency and Worker.
    await Business.findOneAndUpdate(
      { _id: body.businessId },
      { $addToSet: { workContracts: contractToCreate._id } },
      undefined,
      async (error: Error, result: any) => {
      if (error || !result) {
        return res
          .status(500)
          .send({ error, message: "Could not add WorkContract to Business  with ID" + body.businessId + ". No WorkContract created." })
      }
    })
    let noErrorInDelete: boolean | undefined;
    await Agency.findOneAndUpdate(
      { _id: res.locals.decoded.id },
      { $addToSet: { workContracts: contractToCreate._id } },
      undefined,
      async (error: Error, result: any) => {
      if (error || !result) {
        await deleteTracesOfFailedWorkContract(null, body.businessId, res.locals.decoded.id, contractToCreate._id,
          (result: any) => {
            noErrorInDelete = result.success
          })
        if (noErrorInDelete) {
          return res
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created but references were deleted." })
        } else {
          return res
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to Agency  with ID" + res.locals.decoded.id + ". No WorkContract created and references were not deleted." })
        }
      }
    })
    await User.findOneAndUpdate(
      { _id: body.workerId },
      { $addToSet: { workContracts: contractToCreate._id } },
      undefined,
      async (error: any, result: any) => {
      if (error || !result) {
        await deleteTracesOfFailedWorkContract(body.workerId, body.businessId, res.locals.decoded.id, contractToCreate._id,
          (result: any) => {
            noErrorInDelete = result.success
          })
        if (noErrorInDelete) {
          return res
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to User  with ID" + body.workerId + ". No WorkContract created but references were deleted." })
        } else {
          return res
            .status(500)
            .send({ error,
              message: "Could not add WorkContract to User  with ID" + body.workerId + ". No WorkContract created and references were not deleted." })
        }
      }
    })
    //Next check that workContract doesn't allready exist
    let contract = undefined
    const commonWorkContractArray = await WorkContract.find({
      business:  body.businessId,
      user:  body.workerId
    })
    if (commonWorkContractArray[0]) {
      contract = null
    } else {
      contract = await contractToCreate.save()
    }
    //If contract allready exist deleteTraces, if not return res url.
    if (!contract) {
      await deleteTracesOfFailedWorkContract(body.workerId, body.businessId, res.locals.decoded.id, contractToCreate._id,
        (result: any) => {
          noErrorInDelete = result.success
        })
      if (noErrorInDelete) {
        return res
          .status(500)
          .send({ message: "Could not make WorkContract because agency,business and worker allready have WorkContract. No WorkContract created but references were deleted." })
      } else {
        return res
          .status(500)
          .send({ message: "Could not make WorkContract. No WorkContract created and references were not deleted. WorkContract allready exist" })
      }
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
 * @throws {JSON} Status 401 - res.body: { message: "This route is only available to Agency,Business and Worker who are in this contract." }
 * @throws {JSON} Status 400 - res.body: { success: false, error: "Could not update WorkContract with id " + req.params.contractId }
 * @returns {JSON} Status 200 - res.body: { The updated workcontract object }
 */
workcontractsRouter.put("/:contractId", authenticateToken, needsToBeAgencyBusinessOrWorker, workContractExists, workContractIncludesUser, (req, res, next) => {
  // TODO: Validate the id, check that the logged in user is authored for this
  // TODO: What form the end date need to be?
  const { body, params } = req 
  try {
    if (body.userInWorkContract !== true) {
      return res.status(401).send({ message: "This route is only available to Agency,Business and Worker who are in this contract." })
    }
    const updateFields = {
      ...body
    }
    return WorkContract.findByIdAndUpdate(params.contractId, updateFields, { new: false, omitUndefined: true, runValidators: false }, (error, result) => {
      if (!result || error) {
        return res.status(400).send(error || { success: false, error: "Could not update WorkContract with id " + req.params.contractId })
      } else {
        return res.status(200).send(result)
      }
    })
  } catch (exception) {
    return next(exception)
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
 * @throws {JSON} Status 401 - res.body: { message: "This route is only available to Agency who is in this contract." }
 * @throws {JSON} Status 500 - res.body: { message: "Deleted references to WorkContract with ID " + req.workContract._id +
                    "but could not remove the contract itself. Possible error: " +
                    error, }
 * @throws {JSON} Status 500 - res.body: { message: "Couldn't delete references of this WorkContract"+
             ", WorkerTraceRemoved: "+result.workerTraceRemoved+
             ", businessTraceRemoved: "+result.businessTraceRemoved+
             ", agencyTraceRemoved: "+result.agencyTraceRemoved}
 * @returns {JSON} Status 200 - res.body: { The deleted WorkContract object }
 */
workcontractsRouter.delete("/:contractId",authenticateToken,needsToBeAgency,workContractExists,workContractIncludesUser, async (req, res, next) => {
  const { body, params } = req 

  if (body.userInWorkContract !== true)
    return res.status(401).send( { message: "This route is only available to Agency who is in this contract." })
  
  try {
    deleteTracesOfFailedWorkContract(
      body.workContract.user,
      body.workContract.business,
      body.workContract.agency,
      params.contractId,
      async (result: any) => {
        if (result.workerTraceRemoved === true && result.businessTraceRemoved === true && result.agencyTraceRemoved === true) {
          return await WorkContract.findByIdAndDelete(
            body.workContract._id,
            undefined,
            (error: Error, result: any) => {
              if (error || !result) {
                return res.status(500).json({
                  message:
                    "Deleted references to WorkContract with ID " +
                    body.workContract._id +
                    " but could not remove the contract itself. Possible error: " +
                    error,
                })
              } else {
                return res.status(200).json({ result })
              }
            }
          )
        } else {
          return res.status(500).json({
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