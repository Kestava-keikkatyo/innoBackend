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
const workcontractsRouter = require("express").Router()
const { body } = require("express-validator")
const Agency = require("../models/Agency")
const Business = require("../models/Business")
const WorkContract = require("../models/WorkContract")
const User = require("../models/User")
const BusinessContract = require("../models/BusinessContract")
const authenticateToken = require("../utils/auhenticateToken")
const { needsToBeAgency, bodyBusinessExists, workContractExists, needsToBeAgencyBusinessOrWorker, workContractIncludesUser } = require("../utils/middleware")
const { workerExists, deleteTracesOfFailedWorkContract } = require("../utils/common")
const logger = require("../utils/logger")

const domainUrl = "http://localhost:8000/"
const workContractsApiPath = "workcontracts/"

/**
 * Returns response.body: { The found WorkContract object }
 * Should require that the logged in user is authored to see this contract
 * @name GET /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
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
  }
})

/**
 * Returns response.body: { All users WorkContract objects }
 * Requires that logged in user is agency, business or worker.
 * @name GET /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 */
workcontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (request, response, next) => {
  try {
    if (request.agency !== undefined) {
      const populatedUser = await Agency.findById(request.agency.id).populate({
        path:"workContracts", model: "WorkContract" }).exec()
      return response.status(200).send(populatedUser.workContracts)
    }
    else if (request.business !== undefined) {
      const populatedUser = await Business.findById(request.business.id).populate({
        path:"workContracts", model: "WorkContract" }).exec()
      return response.status(200).send(populatedUser.workContracts)
    }
    else if (request.user !== undefined) {
      const populatedUser = await User.findById(request.user.id).populate({
        path:"workContracts", model: "WorkContract" }).exec()
      return response.status(200).send(populatedUser.workContracts)
    }
    else {
      return response.status(400).send({ message:"Token didn't have any users." })
    }
  } catch (exception) {
    next(exception)
  }
})

/**
 * Requires User logged in as Agency. request.body MANDATORY: { businessId: "businessId", workerId: "workerId", validityPeriod: "valid end date" }. request.body OPTIONAL: { processStatus: "integer" } has a default of "1"
 * Agency creates a new WorkContract between a Business and a Worker.
 * The WorkContract id is then saved to lists in: Worker, Agency, Business
 * Returns response.body: { created: domainUrl + workContractsApiPath + contract._id }
 * @example { created: http://localhost:8080/api/workcontracts/2lkdfrakws9a9vcsv}
 * @name POST /workcontracts
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
 */
workcontractsRouter.post("/", authenticateToken, needsToBeAgency, bodyBusinessExists, async (request, response, next) => {
  try {
    // TODO: Validate body objects for malicious code, and the validate the validityPeriod date object and processStatus for correctness
    const businessId = request.body.businessId
    console.log("businessId" + businessId)
    const workerId = request.body.workerId
    const validityPeriod = new Date(request.body.validityPeriod)
    const processStatus = request.body.processStatus
    const agencyId = response.locals.decoded.id


    // Check contract between business and agency, and user and agency
    // request.agency.businessContracts
    // Go through the contracts from this agency and check if the required :businessId and :workerId can be found from any of them
    let commonContractIndex = -1
    if (request.agency.businessContracts || request.agency.businessContracts.length > 0) {
      await Promise.all(request.agency.businessContracts.map(async (element) => {
        await BusinessContract.findById(element._id,{ business:1,user:1,contractMade:1  },  (err, contract) => {
          if (err) {
            commonContractIndex = -1
          } else {
            console.log("Result:", contract)
            switch (contract.business) {
            case undefined:
              if (contract.user._id.toString() === workerId.toString() && contract.contractMade === true) {
                commonContractIndex++
              }
              break
            default:
              if (contract.business._id.toString() === businessId.toString() && contract.contractMade === true) {
                commonContractIndex++
              }
              break
            }
          }
        })
      }))
      console.log(commonContractIndex)
    }
    console.log("commoncontractindex: " + commonContractIndex)
    if (commonContractIndex === -1) {
      return response.status(400).json({ message: "The logged in Agency has no BusinessContracts with Business or Agency" }).end()
    } else if (commonContractIndex === 0) {
      return response.status(400).json({ message: "The logged in Agency has BusinessContract with Business or Worker but not for both" })
    }

    workerExists(workerId, next, (worker) => {
      if(!worker) {
        return response.status(404).json({ success: false, message: "Couldn't find Worker with ID " + body.workerId })
      }
    })

    let createFields = {
      business: businessId,
      user: workerId,
      agency: agencyId,
      validityPeriod: validityPeriod,
      processStatus: processStatus //Mihin tätä tarvitaan? Workcontractin hyväksymiseen? Täytyy lisätä workcontractiin kyseinen field
    }
    if (body.processStatus) {
      createFields.processStatus = body.processStatus
    }

    const contractToCreate = new WorkContract(createFields)

    // Add the contract id to the business, agency and worker
    await Business.findOneAndUpdate( { _id: businessId }, { $addToSet: { workContracts: contractToCreate._id } }, (error, result) => {
      if (!result || error) {
        // Adding the WorkContract to Business failed, no contract saved
        return response
          .status(500)
          .send(error || { message: "Could not add WorkContract to Business  with ID" + businessId + ". No WorkContract created." })
      }
    })

    let errorInDelete = null
    await Agency.findOneAndUpdate({ _id: agencyId }, { $addToSet: { workContracts: contractToCreate._id } }, (error, result) => {
      if (!result || error) {
        console.log("Adding the WorkContract to Agency failed, no contract saved. Running deleteTracesOfFailedWorkContract()")
        // Adding the WorkContract to Agency failed, no contract saved
        deleteTracesOfFailedWorkContract(workerId, businessId, agencyId, contractToCreate._id, next, (result) => {
          errorInDelete = result.success
        })
        // Deleting the id of the new WorkContract from agency, business, worker was successful
        if (!errorInDelete) {
          logger.error("Could not add WorkContract to Agency  with ID" + agencyId + ". No WorkContract created.")
          return response
            .status(500)
            .send(error || { message: "Could not add WorkContract to Agency  with ID" + agencyId + ". No WorkContract created." })
        } else if (errorInDelete) {
          // Deleting the id references for the nonexisting WorkContract was not successful, log the result.
          logger.error("Could not add WorkContract to Agency  with ID" + agencyId + ". No WorkContract created, but references to the nonexisting workContract ID " + contractToCreate._id+" could not be removed. \n"
            + "Check Agency with ID " + agencyId + " and Business with ID " + businessId + ".")
          return response
            .status(500)
            .send(error || { message: "Could not add WorkContract to Agency  with ID" + agencyId + ". No WorkContract created." })
        }
      }
    })

    errorInDelete = null
    await User.findOneAndUpdate({ _id: workerId }, { $addToSet: { workContracts: contractToCreate._id } }, (error, result) => {
      if (!result || error) {
        // Adding the WorkContract to Worker failed, no contract saved
        deleteTracesOfFailedWorkContract(workerId, businessId, agencyId, contractToCreate._id, next, (result) => {
          errorInDelete = result.success
        })

        if (!errorInDelete) {   // Deleting the id of the new WorkContract from agency, business, worker was successful
          logger.error("Could not add WorkContract to Worker  with ID" + workerId + ". No WorkContract created.")
          return response
            .status(500)
            .send(error || { message: "Could not add WorkContract to Worker  with ID" + workerId + ". No WorkContract created." })
        } else if (errorInDelete) {
          // Deleting the id references for the nonexisting WorkContract was not successful, log the result.
          logger.error("Could not add WorkContract to Worker  with ID" + workerId + ". No WorkContract created, but references to the nonexisting workContract ID " + contractToCreate._id+" could not be removed. \n"
            + "Check  with ID " + agencyId + " and Business with ID " + businessId + " and Worker with ID " + workerId + ".")
          return response
            .status(500)
            .send(error || { message: "Could not add WorkContract to Worker  with ID" + agencyId + ". No WorkContract created, but references to the nonexisting workContract ID " + contractToCreate._id+" could not be removed. \n"
                + "Check  with ID " + agencyId + " and Business with ID " + businessId + " and Worker with ID " + workerId + "." })
        }
      }
    })
    let contract = undefined
    // Updating Agency, Business, Worker successful
    const commonWorkContractArray = await WorkContract.find({
      business: businessId,
      user: workerId
    })
    if (commonWorkContractArray[0]) {
      contract = null
    } else {
      contract = await contractToCreate.save()
    }
    //console.log(contract.toString)
    if (!contract) {
      deleteTracesOfFailedWorkContract(workerId, businessId, agencyId, contractToCreate._id, next, (result) => {
        errorInDelete = result.success
      })
      // Deleting the id of the new WorkContract from agency, business, worker was successful
      if (!errorInDelete) {
        logger.error("Could not save WorkContract with ID" + contractToCreate._id + ". No WorkContract created.")
        return response
          .status(500)
          .send( { message: "Could not save WorkContract with ID" + contractToCreate._id + ". No WorkContract created." })
      } else if (errorInDelete) {
        // Deleting the id references for the nonexisting WorkContract was not successful, log the result.
        logger.error("Could not save WorkContract with ID" + contractToCreate._id + ". No WorkContract created, but references to the nonexisting workContract could not be removed. \n"
            + "Check  with ID " + agencyId + " and Business with ID " + businessId + " and Worker with ID " + workerId + ".")
        return response
          .status(500)
          .send( { message: "Could not save WorkContract with ID" + contractToCreate._id + ". No WorkContract created, but references to the nonexisting workContract could not be removed. \n"
                + "Check  with ID " + agencyId + " and Business with ID " + businessId + " and Worker with ID " + workerId + "." })
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
 * Returns response.body: { The updated workcontract object }
 * Requires TODO: Should check that the logged in user is authored for this
 * Update a WorkContract
 * Body can contain one or more of the following:
 * { businessId: "businessId", workerId: "workerId", validityPeriod: "valid end date", processStatus: "integer"}
 * @name PUT /workcontracts/:contractId
 * @function
 * @memberof module:controllers/workcontracts~workcontractsRouter
 * @inner
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
        response.status(400).send(error || { success: false, error: "Could not update WorkContract with id " + request.params.contractId })
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
 */
workcontractsRouter.delete("/:contractId", authenticateToken, workContractExists, needsToBeAgency, async (request, response, next) => {
  try {
    const businessId = request.workContract.business
    const workerId = request.workContract.user
    const agencyId = request.workContract.agency
    const workcontractId = request.params.contractId
    if (response.locals.decoded.id.toString() !== agencyId.toString()) {
      return response.status(500).json({
        message: "Agency is not same agency that workcontract has."
      })
    }
    let success = null
    await deleteTracesOfFailedWorkContract(workerId,businessId,agencyId,workcontractId,next, (result) => {
      if (result) {
        success = result.success
      }
    })
    if (!success) {
      return response.status(500).json({
        message:
            "Couldn't delete references to WorkContract with ID"
      })} else {
      WorkContract.findByIdAndDelete(
        workcontractId,
        (error, result) => {
          if (error || !result) {
            return response.status(500).json({
              message:
                  "Deleted references to WorkContract with ID " +
                   +
                   " but could not remove the contract itself. Possible error: " +
                  error,
            })
          } else {
            return response.status(200).json({ result })
          }
        }
      )
    }
  } catch (exception) {
    next(exception)
  }
})
module.exports = workcontractsRouter