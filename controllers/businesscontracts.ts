/** Express router providing BusinessContract-related routes
 * @module controllers/businesscontracts
 * @requires express
 */

/**
 * Express router to mount BusinessContract-related functions on.
 * @type {object}
 * @const
 * @namespace businesscontractsRouter
*/
import express, { Response } from "express"
import authenticateToken from "../utils/auhenticateToken"
import BusinessContract from "../models/BusinessContract"
import { businessContractExists,
  needsToBeAgency,
  businessContractIncludesUser,
  needsToBeAgencyBusinessOrWorker,
  needsToBeBusinessOrWorker,
  bodyWorkerOrBusinessExists } from "../utils/middleware"
import { error as _error, info } from "../utils/logger"
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import Business from "../models/Business"
import { buildPaginatedObjectFromArray, deleteTracesOfBusinessContract } from "../utils/common"

const businesscontractsRouter = express.Router()
const domainUrl = "http://localhost:3000/"
const businessContractsApiPath = "api/businesscontracts/"

/**
 * TODO:THIS ROUTE DOESNT WORK RIGHT
 * Route for getting one specific businessContract.
 * Requires user logged in as a participant of this specific BusinessContract.
 * @name GET /businesscontracts/:businessContractId
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} businessContractExists -
 * Checks if a BusinessContract with url param :businessContractId exists.
 * <pre>Full description: {@link businessContractExists}</pre>
 * @param {callback} businessContractIncludesUser -
 * Checks if BusinessContract includes user that is trying to get it.
 * <pre>Full description: {@link businessContractIncludesUser}</pre>
 * @throws {JSON} Status 400 - response.body: { message: "User who is trying to use this route is not in workcontract" }
 * @returns {JSON} Status 200 - response.body: { businessContract: TheWholeBusinessContractObject }
 */
businesscontractsRouter.get(
  "/:businessContractId",
  authenticateToken,
  businessContractExists,
  businessContractIncludesUser,
  async (req, res, next) => {
    const { body } = req
    try {
      if (body.userInBusinessContract) {
        return res.status(200).send(body.businessContract)
      } else {
        return res.status(400).send({ message:"User who is trying to use this route is not in workcontract" })
      }
    } catch (exception) {
      console.log(exception.message)
      return next(exception)
    }
  }
)

/**
 * Route for getting all users businessContract.
 * Requires token for use.
 * @name GET /businesscontracts/:businessContractId
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgencyBusinessOrWorker - Checks if the logged in user is Agency, Business or Worker.
 * <pre>Full description: {@link needsToBeAgencyBusinessOrWorker}</pre>
 * @throws {JSON} Status 400 - response.body: { message:"Token didn't have any users." }
 * @returns {JSON} Status 200 - response.body: { All users BusinessContract objects }
 */
businesscontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req, res, next) => {
    const { query, body } = req
    try {
      //Initialise page,limit,myId,model
      const page: number = parseInt(query.page as string, 10)
      const limit: number = parseInt(query.limit as string, 10)
      let array: {}
      //Check that page and limit exist and are not bellow 1
      if (page < 1 || !page) {
        return res.status(400).send({ message: "Missing or incorrect page parameter" })
      }
      if (limit < 1 || !limit) {
        return res.status(400).send({ message: "Missing or incorrect limit parameter" })
      }
      //Which id is in question
      if (body.agency !== undefined) {
        array = {_id: {$in: body.agency.businessContracts}}
      }
      else if (body.business !== undefined) {
        array = {_id: {$in: body.business.businessContracts}}
      }
      else if (body.worker !== undefined) {
        array =  {_id: {$in: body.worker.businessContracts}}
      }
      else {
        return res.status(400).send({ message:"Token didn't have any users." })
      }
      return await BusinessContract.find(array,(err,result) => {
        if (err || !result) {
          return res.status(404).send({ error:err.message, message:"Couldn't find any BusinessContracts" })
        } else {
          return res.status(200).send(buildPaginatedObjectFromArray(page,limit,result))
        }
      })
    } catch (exception) {
      return next(exception)
    }
  })

/**
 * Route for initiating a connection between Agency and Business or Worker.
 * Requires User logged in as an Agency. body requirements: {businessId: "businessId" OR workerId: "workerId"}.
 * The BusinessContract is created and the url to the contract resource is returned so that it can be sent to the Business or Worker.
 * Gets agencyId from jwt-token.
 * @name POST /businesscontracts
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks if the logged in user is an Agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} bodyWorkerOrBusinessExists - Checks if a Business or Worker exists.
 * <pre>Full description: {@link bodyWorkerOrBusinessExists }</pre>
 * @see {@link createBusinessContract}
 * @see {@link createBusinessContractCallBack}
 * @see {@link addBusinessContractToParticipants}
 * @throws {JSON} Status 400 - response.body:
 * { message:"Agency (ID response.locals.decoded.id) already has a BusinessContract with Worker (ID request.body.workerId).", existingContract: commonContractsArray[0] }
 * @throws {JSON} Status 400 - response.body:
 * { message:"Agency (ID response.locals.decoded.id) already has a BusinessContract with Worker (ID request.body.businessId).", existingContract: commonContractsArray[0] }
 * @returns {JSON} Status 201 - response.body: { The created businessContract object }, response.header.Location: created businesscontract url api/businesscontracts/:businessContractId
 */
businesscontractsRouter.post("/",
authenticateToken,
needsToBeAgency,
bodyWorkerOrBusinessExists,
async (req, res, next) => {
  const { body } = req

  try {
    let contractToCreate = undefined
    if (body.contractType === "Worker") { //request.contractType is from bodyWorkerOrBusinessExists() middleware
      contractToCreate = {
        agency: res.locals.decoded.id,
        worker: body.workerId,
        contractType: "Worker"
      }
      const commonContractsArray = await BusinessContract.find({ // Check if worker has allready businessContract with agency.
        agency: contractToCreate.agency,
        worker: contractToCreate.worker,
      },
      undefined,
      { lean: true })
      if (commonContractsArray[0]) {
        // The Agency already has a businessContract with the Worker
        return res.status(400).json({
          message:
            "Agency (ID " +
            res.locals.decoded.id +
            ") already has a BusinessContract with Worker (ID " +
            body.workerId +
            ").",
          existingContract: commonContractsArray[0],
        })
      }
    } else if (body.contractType === "Business") { //request.contractType is from bodyWorkerOrBusinessExists() middleware
      contractToCreate = {
        agency: res.locals.decoded.id,
        business: body.businessId,
        contractType: "Business"
      }
      const commonContractsArray = await BusinessContract.find({ // Check if Business has allready businessContract with agency.
        agency: res.locals.decoded.id,
        business: body.businessId,
      },
      undefined,
      { lean: true })
      if (commonContractsArray[0]) {
        // The Agency already has a businessContract with the Business
        return res.status(400).json({
          message:
            "Agency (ID " +
            res.locals.decoded.id +
            ") already has a BusinessContract with Business (ID " +
            body.businessId +
            ").",
          existingContract: commonContractsArray[0],
        })
      }
    }
    //Now we can make new businessContract
    createBusinessContract(
      contractToCreate,
      res,
      createBusinessContractCallBack
    )
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for a Business/Worker to accept a BusinessContract created by an Agency.
 * Requires user logged in as a Business/Worker taking part in this specific BusinessContract.
 * businessContractId is read from url param and the matching BusinessContract is put to request.businessContract by businessContractExists-middleware.
 * @name PUT /businesscontracts/:businessContractId
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeBusinessOrWorker -
 * Checks if the logged in user is Business or Worker
 * <pre>Full description: {@link needsToBeBusinessOrWorker}</pre>
 * @param {callback} businessContractExists -
 * Checks if a BusinessContract with url param :businessContractId exists.
 * <pre>{@link businessContractExists}</pre>
 * @param {callback} businessContractIncludesUser -
 * Checks if BusinessContract includes user that is trying to get it.
 * <pre>{@link businessContractIncludesUser}</pre>
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to Business and Worker who are in this contract." }
 * @throws {JSON} Status 400 - response.body: { success: false, error: "Could not update BusinessContract with id " + request.params.businessContractId }
 * @returns {JSON} Status 200 - response.body: { The updated BusinessContract object }, response.header.Location: The updated businesscontract url api/businesscontracts/:businessContractId
 */
businesscontractsRouter.put("/:businessContractId",
authenticateToken,
needsToBeBusinessOrWorker,
businessContractExists,
businessContractIncludesUser,
async (req, res, next) => {
  const { body, params } = req
  try {
    if (body.userInBusinessContract !== true) {
      return res.status(401).send({ message: "This route is only available to Business and Worker who are in this contract." })
    }
    await BusinessContract.findByIdAndUpdate(
      params.businessContractId,
      { contractMade: true },
      { new: false, omitUndefined: true, runValidators: false, lean: true },
      (error: Error, result: any) => {
        if (!result || error) {
          return res.status(400).send(error || { success: false, error: "Could not update BusinessContract with id " + params.businessContractId })
        } else {
          return res.status(200).header({ Location: domainUrl + businessContractsApiPath + result._id, }).send(result)
        }
      })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for an Agency to delete an existing BusinessContract and remove its references from its participants.
 * Requires user logged in as an Agency taking part in this specific BusinessContract.
 * businessContractId is read from url param and the matching BusinessContract is put to request.businessContract by businessContractExists-middleware
 * The logged in Agency object is in request.agency by needsToBeAgency-middleware
 * @name DELETE /businesscontracts/:businessContractId
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency -
 * Checks if the logged in user is an Agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} businessContractExists -
 * Checks if a BusinessContract with url param :businessContractId exists.
 * <pre>Full description: {@link businessContractExists}</pre>
 * @param {callback} businessContractIncludesUser -
 * Checks if BusinessContract includes user that is trying to get it.
 * <pre>Full description: {@link businessContractIncludesUser}</pre>
 * @throws {JSON} Status 401 - response.body: { message: "This route is only available to agency who is in this contract" }
 * @throws {JSON} Status 500 - response.body: { message: "Couldn't delete references of this BusinessContract
 * , WorkerTraceRemoved:  result.workerTraceRemoved
 * , businessTraceRemoved: result.businessTraceRemoved
 * , agencyTraceRemoved:  result.agencyTraceRemoved"  }
 * @throws {JSON} Status 500 - response.body { message:
 * "Deleted references to BusinessContract with ID request.businessContract._id but could not remove the contract itself.
 *  Possible error:" error }
 * @returns {JSON} Status 200 - response.body: { The updated BusinessContract object }, response.header.Location: The updated businesscontract url api/businesscontracts/:businessContractId
 */
businesscontractsRouter.delete(
"/:businessContractId",
authenticateToken,
needsToBeAgency,
businessContractExists,
businessContractIncludesUser,
async (req, res, next) => {
  const { body } = req

  try {
    if (body.userInBusinessContract !== true) {
      return res.status(401).send({ message: "This route is only available to agency who is in this contract " } )
    }
    deleteTracesOfBusinessContract(body.businessContract,
      async (result: any) => {
        if ((result.workerTraceRemoved === true && result.businessTraceRemoved === undefined && result.agencyTraceRemoved === true) ||
        (result.workerTraceRemoved === undefined && result.businessTraceRemoved === true && result.agencyTraceRemoved === true) ) {
          return await BusinessContract.findByIdAndDelete(
            body.businessContract._id,
            undefined,
            (error: Error, result: any) => {
              if (error || !result) {
                return res.status(500).json({
                  message:
                  "Deleted references to BusinessContract with ID " +
                  body.businessContract._id +
                  " but could not remove the contract itself. Possible error: " +
                  error,
                })
              } else {
                return res.status(200).header({ Location: domainUrl + businessContractsApiPath + result._id, }).json({ result })
              }
            }
          )
        } else {
          return res.status(500).json( {
            message: "Couldn't delete references of this BusinessContract"+
            ", WorkerTraceRemoved: "+result.workerTraceRemoved+
            ", businessTraceRemoved: "+result.businessTraceRemoved+
            ", agencyTraceRemoved: "+result.agencyTraceRemoved } )
        }
      })
  } catch (exception) {
    return next(exception)
  }
})
/**
 * Helper function to avoid duplicate code. Function creates the businessContract and saves it to database.
 * Note: ONLY workerId OR businessId should be present in participants. Otherwise will return an error.
 * Returns {Object|Error} Error if saving the contract was not successful or both workerId and businessId were given in parameter. A BusinessContract object if saving to database was successful.
 * @name createBusinessContract
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {Object} participants - { agencyId, businessId || workerId }
 * @param {String} participants.agencyId - Agency to be saved to the BusinessContract
 * @param {String} participants.businessId - Business to be saved to the BusinessContract
 * @param {String} participants.workerId - Worker to be saved to the BusinessContract
 */
const createBusinessContract = (contractToCreate: any, response: Response, callback: Function) => {
  if (contractToCreate.business && contractToCreate.worker) {
    callback(
      new Error(
        "Both businessId and workerId given to createBusinessContract(), can take only either one."
      ),
      null,
      response
    )
  }

  const businessContract: any = new BusinessContract({
    agency: contractToCreate.agency,
  })
  //Checks which contract is made  a) Agency and Worker or b) Agency and Business.
  if (contractToCreate.worker && !contractToCreate.business) {
    businessContract.worker = contractToCreate.worker
    businessContract.contractType = contractToCreate.contractType
  } else {
    businessContract.business = contractToCreate.business
    businessContract.contractType = contractToCreate.contractType
  }

  businessContract.save((error: Error, contract: any) => {
    if (error || !contract) {
      callback(error, null, response)
    } else {
      info("BusinessContract created with ID " + businessContract._id)
      callback(null, contract, response)
    }
  })
}

/**
 * Callback function. Adds BusinessContract to participants with addBusinessContractToParticipants function.
 * Used in createBusinessContract() function as a callback.
 * @name createBusinessContractCallBack
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {*} error
 * @param {*} contract
 * @param {*} response
 * @see {@link addBusinessContractToParticipants}
 */
const createBusinessContractCallBack = async (error: Error, contract: any, response: Response) => {
  info("In createBusinessContractCallBack...")
  if (error || !contract) {
    return response.status(500).json({
      error:
        "Could not save BusinessContract instance to database. Possible error message: " +
        error,
    })
  } else {
    // add to participants
    info("Adding created contract to participants...")
    info(contract)
    return await addBusinessContractToParticipants(contract, (error: Error, result: any) => {
      if (error || !result) {
        // Couldn't add the contract to a participant, rollback everything
        // check error.needToBeCleanedUp to see which participants need have the contract id removed.
        return response.status(500).json({
          message:
            "Unable to add created BusinessContract to participants. Possible Error message: " +
            error.message,
        })
      } else {
        // Create-operation successful
        // Return a response with the created BusinessContract resource uri
        return response
          .status(201)
          .header({
            Location: domainUrl + businessContractsApiPath + contract._id,
          })
          .json({ contract })
      }
    })
  }
  // return response.status(400).send("Bad request")
}


/**
 * After a BusinessContract is made, a reference to it needs to be added to both of its participants.
 * A BusinessContract is always between a) Agency and Worker or b) Agency and Business.
 * @name addBusinessContractToParticipants
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {BusinessContract} contract The created BusinessContract to be added to participants.
 * @param {Function} callback A function(error, result) which will handle the outcome of this function.
 */
const addBusinessContractToParticipants = async (contract: any, callback: Function) => {
  const field: any = { businessContracts: [contract._id] }
  // $addToSet adds to mongoose array if the item does not already exist, thus eliminating duplicates.
  const agency = await Agency.findOneAndUpdate(
    { _id: contract.agency },
    { $addToSet: field },
    { lean: true }
  )
  if (!agency) {
    const error: any = {
      reason: "agency",
      message: `Could not add the BusinessContract to Agency with ID ${contract.agency}.`,
    }
    // No agency found or error happened.
    callback(
      new Error(error),
      null
    )
  } else {
    if (contract.worker) {
      // add to worker
      const worker = await Worker.findOneAndUpdate(
        { _id: contract.worker },
        { $addToSet: field }
      )
      if (!worker) {
        const error: any = {
          needToCleanUp: { agency: contract.agency },
          message: `Could not add the BusinessContract to Worker with ID ${contract.worker}.`,
        }
        // No worker found or error happened
        callback(
          new Error(error),
          null
        )
      } else {
        callback(null, true)
      }
    } else if (contract.business) {
      // add to business
      const business = await Business.findOneAndUpdate(
        { _id: contract.business },
        { $addToSet: field }
      )
      if (!business) {
        const error: any = {
          needToCleanUp: { agency: contract.agency, worker: contract.user },
          message: `Could not add the BusinessContract to Business with ID ${contract.business}.`,
        }
        // No business found or error happened
        callback(
          new Error(error),
          null
        )
      } else {
        callback(null, true)
      }
    }
  }
}

export default businesscontractsRouter
