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
import express from "express"
import authenticateToken from "../utils/auhenticateToken"
import BusinessContract from "../models/BusinessContract"
import { businessContractExists,
  needsToBeAgency,
  businessContractIncludesUser,
  needsToBeAgencyBusinessOrWorker,
  makeBusinessContract,
  businessContractUpdate,
  addContractToBusinessContract,
  acceptBusinessContract,
  declineBusinessContract} from "../utils/middleware"
import { error as _error} from "../utils/logger"
import { buildPaginatedObjectFromArray } from "../utils/common"

const businesscontractsRouter = express.Router()

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
 * Route to initialize BusinessContract for agency.
 * This route is runned when Agency first makes Account to platform.
 */
 businesscontractsRouter.post("/",authenticateToken,needsToBeAgency,makeBusinessContract)
 /**
  * Route to add worker or business to BusinessContract
  * @todo When agency adds worker or business
  */
 businesscontractsRouter.put("/:businessContractId/add",authenticateToken,needsToBeAgencyBusinessOrWorker,businessContractExists,addContractToBusinessContract,businessContractUpdate)
 /**
  * Route for agency to accept BusinessContract
  */
 businesscontractsRouter.put("/:businessContractId/:userId/accept",authenticateToken,needsToBeAgency,businessContractExists,acceptBusinessContract,businessContractUpdate)
 /**
  * Route for agency to decline BusinessContract
  */
 businesscontractsRouter.put("/:businessContractId/:userId/decline",authenticateToken, needsToBeAgency, businessContractExists, declineBusinessContract, businessContractUpdate)


export default businesscontractsRouter
