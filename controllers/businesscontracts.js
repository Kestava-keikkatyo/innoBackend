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
const businesscontractsRouter = require("express").Router()
const authenticateToken = require("../utils/auhenticateToken")
const BusinessContract = require("../models/BusinessContract")
const {
  businessContractExists,
  needsToBeAgency,
  businessContractIncludesUser,
  needsToBeAgencyBusinessOrWorker,
  needsToBeBusinessOrWorker,
  bodyWorkerOrBusinessExists
} = require("../utils/middleware")
const utils = require("../utils/common")
const businessContractsApiPath = "api/businesscontracts/"
const logger = require("../utils/logger")
const domainUrl = "http://localhost:3000/"
const Agency = require("../models/Agency")
const User = require("../models/User")
const Business = require("../models/Business")

/**
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
businesscontractsRouter.get("/:businessContractId", authenticateToken, businessContractExists, businessContractIncludesUser,
  async (request, response, next) => {
    try {
      if (request.userInBusinessContract === true) {
        return response.status(200).send(request.businessContract)
      } else {
        return response.status(400).send({ message:"User who is trying to use this route is not in workcontract" })
      }
    } catch (exception) {
      console.log(exception.message)
      next(exception)
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
businesscontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker,
  async (request, response, next) => {
    try {
      if (request.agency !== undefined) {
        const populatedUser = await Agency.findById(request.agency.id).populate({
          path:"businessContracts", model: "BusinessContract" }).exec()
        return response.status(200).send(populatedUser.businessContracts)
      }
      else if (request.business !== undefined) {
        const populatedUser = await Business.findById(request.business.id).populate({
          path:"businessContracts", model: "BusinessContract" }).exec()
        return response.status(200).send(populatedUser.businessContracts)
      }
      else if (request.worker !== undefined) {
        const populatedUser = await User.findById(request.user.id).populate({
          path:"businessContracts", model: "BusinessContract" }).exec()
        return response.status(200).send(populatedUser.businessContracts)
      }
      else {
        return response.status(400).send({ message:"Token didn't have any users." })
      }
    } catch (exception) {
      next(exception)
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
businesscontractsRouter.post("/test",authenticateToken,needsToBeAgency,bodyWorkerOrBusinessExists,
  async (request,response,next) => {
    try {
      let contractToCreate = undefined
      if (request.contractType === "Worker") { //request.contractType is from bodyWorkerOrBusinessExists() middleware
        contractToCreate = {
          agency: response.locals.decoded.id,
          user: request.body.workerId,
          contractType: "Worker"
        }
        const commonContractsArray = await BusinessContract.find({ // Check if worker has allready businessContract with agency.
          agency: contractToCreate.agency,
          user: contractToCreate.user,
        })
        if (commonContractsArray[0]) {
          // The Agency already has a businessContract with the Worker
          return response.status(400).json({
            message:
              "Agency (ID " +
              response.locals.decoded.id +
              ") already has a BusinessContract with Worker (ID " +
              request.body.workerId +
              ").",
            existingContract: commonContractsArray[0],
          })
        }
      } else if (request.contractType === "Business") { //request.contractType is from bodyWorkerOrBusinessExists() middleware
        contractToCreate = {
          agency: response.locals.decoded.id,
          business: request.body.businessId,
          contractType: "Business"
        }
        const commonContractsArray = await BusinessContract.find({ // Check if Business has allready businessContract with agency.
          agency: response.locals.decoded.id,
          business: request.body.businessId,
        })
        if (commonContractsArray[0]) {
          // The Agency already has a businessContract with the Business
          return response.status(400).json({
            message:
              "Agency (ID " +
              response.locals.decoded.id +
              ") already has a BusinessContract with Business (ID " +
              request.body.businessId +
              ").",
            existingContract: commonContractsArray[0],
          })
        }
      }
      //Now we can make new businessContract
      createBusinessContract(
        contractToCreate,
        response,
        createBusinessContractCallBack
      )
    } catch (exception) {
      next(exception)
    }
  }
)
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
businesscontractsRouter.put("/:businessContractId",authenticateToken,needsToBeBusinessOrWorker,businessContractExists,businessContractIncludesUser,
  async (request, response, next) => {
    try {
      if (request.userInBusinessContract !== true) {
        return response.status(401).send({ message: "This route is only available to Business and Worker who are in this contract." })
      }
      await BusinessContract.findByIdAndUpdate(request.params.businessContractId, { contractMade: true }, { new: false, omitUndefined: true, runValidators: false }, (error, result) => {
        if (!result || error) {
          response.status(400).send(error || { success: false, error: "Could not update BusinessContract with id " + request.params.businessContractId })
        } else {
          return response.status(200).header({ Location: domainUrl + businessContractsApiPath + result._id, }).send(result)
        }
      })
    } catch (exception) {
      next(exception)
    }
  }
)

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
businesscontractsRouter.delete("/:businessContractId",authenticateToken,needsToBeAgency,businessContractExists,businessContractIncludesUser,
  async (request, response, next) => {
    try {
      if (request.userInBusinessContract !== true) {
        return response.status(401).send({ message: "This route is only available to agency who is in this contract " } )
      }
      utils.deleteTracesOfBusinessContract(request.businessContract,next,
        async (result) => {
          if ((result.workerTraceRemoved === true && result.businessTraceRemoved === undefined && result.agencyTraceRemoved === true) ||
          (result.workerTraceRemoved === undefined && result.businessTraceRemoved === true && result.agencyTraceRemoved === true) ) {
            await BusinessContract.findByIdAndDelete(
              request.businessContract._id,
              (error, result) => {
                if (error || !result) {
                  return response.status(500).json({
                    message:
                    "Deleted references to BusinessContract with ID " +
                    request.businessContract._id +
                    " but could not remove the contract itself. Possible error: " +
                    error,
                  })
                } else {
                  return response.status(200).header({ Location: domainUrl + businessContractsApiPath + result._id, }).json({ result })
                }
              }
            )
          } else {
            return response.status(500).json( {
              message: "Couldn't delete references of this BusinessContract"+
              ", WorkerTraceRemoved: "+result.workerTraceRemoved+
              ", businessTraceRemoved: "+result.businessTraceRemoved+
              ", agencyTraceRemoved: "+result.agencyTraceRemoved } )
          }
        })
    } catch (exception) {
      next(exception)
    }
  }
)
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
const createBusinessContract = (contractToCreate, response, callback) => {
  if (contractToCreate.business && contractToCreate.user) {
    callback(
      new Error(
        "Both businessId and workerId given to createBusinessContract(), can take only either one."
      ),
      null,
      response
    )
  }

  const businessContract = new BusinessContract({
    agency: contractToCreate.agency,
  })
  //Checks which contract is made  a) Agency and Worker or b) Agency and Business.
  if (contractToCreate.user && !contractToCreate.business) {
    businessContract.user = contractToCreate.user
    businessContract.contractType = contractToCreate.contractType
  } else {
    businessContract.business = contractToCreate.business
    businessContract.contractType = contractToCreate.contractType
  }

  businessContract.save((error, contract) => {
    if (error || !contract) {
      callback(error, null, response)
    } else {
      logger.info("BusinessContract created with ID " + businessContract._id)
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
const createBusinessContractCallBack = (error, contract, response) => {
  logger.info("In createBusinessContractCallBack...")
  if (error || !contract) {
    return response.status(500).json({
      error:
        "Could not save BusinessContract instance to database. Possible error message: " +
        error,
    })
  } else {
    // add to participants
    logger.info("Adding created contract to participants...")
    logger.info(contract)
    addBusinessContractToParticipants(contract, (error, result) => {
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
const addBusinessContractToParticipants = async (contract, callback) => {
  // $addToSet adds to mongoose array if the item does not already exist, thus eliminating duplicates.
  const agency = await Agency.findOneAndUpdate(
    { _id: contract.agency },
    { $addToSet: { businessContracts: [contract._id] } }
  )
  if (!agency) {
    // No agency found or error happened.
    callback(
      new Error({
        reason: "agency",
        message:
          "Could not add the BusinessContract to Agency with ID " +
          contract.agency +
          ".",
      }),
      null
    )
  } else {
    if (contract.user) {
      // add to worker
      const worker = await User.findOneAndUpdate(
        { _id: contract.user },
        { $addToSet: { businessContracts: [contract._id] } }
      )
      if (!worker) {
        // No worker found or error happened
        callback(
          new Error({
            needToCleanUp: { agency: contract.agency },
            message:
              "Could not add created BusinessContract to Worker with ID " +
              contract.user +
              ".",
          }),
          null
        )
      } else {
        callback(null, true)
      }
    } else if (contract.business) {
      // add to business
      const business = await Business.findOneAndUpdate(
        { _id: contract.business },
        { $addToSet: { businessContracts: [contract._id] } }
      )
      if (!business) {
        // No business found or error happened
        callback(
          new Error({
            needToCleanUp: { agency: contract.agency, worker: contract.user },
            message:
              "Could not add created BusinessContract to Business with ID " +
              contract.business +
              ".",
          }),
          null
        )
      } else {
        callback(null, true)
      }
    }
  }
}

module.exports = businesscontractsRouter
