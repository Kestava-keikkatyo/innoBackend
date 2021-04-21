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
import express, {NextFunction, Request, Response} from "express"
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
import {CallbackError, DocumentDefinition} from "mongoose"
import {IBaseBody} from "../objecttypes/otherTypes";
import {IBusinessContractDocument} from "../objecttypes/modelTypes";

const businesscontractsRouter = express.Router()

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
businesscontractsRouter.get("/:businessContractId", authenticateToken, needsToBeAgencyBusinessOrWorker,businessContractExists, businessContractIncludesUser,
  async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
    const { body } = req
    try {
      if (body.userInBusinessContract) {
         //Which id is in question
        if (body.agency !== undefined) {
          return res.status(200).send(body.businessContract)
        }
        else if (body.business !== undefined) {
          return res.status(200).send({ "id":body.businessContract?._id,"agency": body.businessContract?.agency})
        }
        else if (body.worker !== undefined) {
          return res.status(200).send({ "id":body.businessContract?._id,"agency": body.businessContract?.agency})
        }
      } else {
        return res.status(400).send({ message:"User who is trying to use this route is not in workcontract" })
      }
    } catch (exception) {
      _error(exception.message)
      return next(exception)
    }
  }
)

/**
 * Route for getting all users businessContract.
 * Requires token for use.
 * @name GET /businesscontracts/
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
businesscontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
    const { query, body } = req
    try {
      //Initialise page, limit, myId, model
      let page: number = parseInt(query.page as string, 10)
      let limit: number = parseInt(query.limit as string, 10)
      let array: {}
      let projection: string = ''
      //Check that page and limit exist and are not below 1
      if (page < 1 || !page) {
        page = 1
      }
      if (limit < 1 || !limit) {
        limit = 5
      }
      //Which id is in question
      if (body.agency) {
        array = {_id: {$in: body.agency.businessContracts}}
      }
      else if (body.business) {
        array = {_id: {$in: body.business.businessContracts}}
        projection = 'agency'
      }
      else if (body.worker) {
        array =  {_id: {$in: body.worker.businessContracts}}
        projection = 'agency'
      }
      else {
        return res.status(400).send({ message:"Token didn't have any users." })
      }
      return await BusinessContract.find(array,
        projection,
        { lean: true },
        (err: CallbackError, result: DocumentDefinition<IBusinessContractDocument>[]) => {
        if (err || !result) {
          return res.status(404).send(err || { message:"Couldn't find any BusinessContracts" })
        } else {
          return res.status(200).send(buildPaginatedObjectFromArray(page, limit, result))
        }
      })
    } catch (exception) {
      return next(exception)
    }
  })

/**
 * Route to initialize BusinessContract for agency.
 * This route is runned when Agency first makes Account to the platform.
 * Creates BusinessContract object to database for agency.
 * @name POST /businesscontracts/
 * @function
 * @memberof module:controllers/businesscontracts~businesscontractsRouter
 * @inner
 * @param {String} path - Express path.
 * @param {callback} authenticateToken - Decodes token.
 * @param {callback} needsToBeAgency - Checks that user is agency.
 * <pre>Full description: {@link needsToBeAgency}</pre>
 * @param {callback} makeBusinessContract - Makes BusinessContract object for agency.
 * <pre>Full description: {@link makeBusinessContract}</pre>
 */
 businesscontractsRouter.post("/",authenticateToken,needsToBeAgency,makeBusinessContract)
 /**
  * Route to add worker or business to BusinessContract.
  * All users can use this route. If Business or Worker uses this route
  * usersId is added to BusinessContracts requestContract object.
  * If Agency uses this route agency must provide userId in body.
  * And UserId is added to madeContracts object.
  * @name PUT /businesscontracts/:businessContractId/add
  * @function
  * @memberof module:controllers/businesscontracts~businesscontractsRouter
  * @inner
  * @param {String} path - Express path.
  * @param {callback} authenticateToken - Decodes token.
  * @param {callback} needsToBeAgencyBusinessOrWorker - Checks that user is Agency,Business or Worker.
  * <pre>Full description: {@link needsToBeAgencyBusinessOrWorker}</pre>
  * @param {callback} businessContractExists - Checks that BusinessContract exists in database.
  * <pre>Full description: {@link businessContractExists}</pre>
  * @param {callback} addContractToBusinessContract - Initializes update that adds userid to BusinessContract requestContract object.
  * <pre>Full description: {@link addContractToBusinessContract}</pre>
  * @param {callback} businessContractUpdate - Runs update.<pre>Full description: {@link businessContractUpdate}</pre>
  */
 businesscontractsRouter.put("/:businessContractId/add",authenticateToken,needsToBeAgencyBusinessOrWorker,businessContractExists,addContractToBusinessContract,businessContractUpdate)
 /**
  * Route for agency to accept BusinessContract with Business or Worker.
  * This route can be used when agency has users in BusinessContracts requestContract object.
  * UserId is deleted from requestContract object and moved to madeContracts object.
  * @name PUT /businesscontracts/:businessContractId/:userId/accept
  * @function
  * @memberof module:controllers/businesscontracts~businesscontractsRouter
  * @inner
  * @param {String} path - Express path.
  * @param {callback} authenticateToken - Decodes token.
  * @param {callback} needsToBeAgency - Checks that user is Agency.
  * <pre>Full description: {@link needsToBeAgency}</pre>
  * @param {callback} businessContractExists - Checks that BusinessContract exists in database.
  * <pre>Full description: {@link businessContractExists}</pre>
  * @param {callback} acceptBusinessContract - Initializes update that accepts userid from requestContract object and changes its location to madeContracts object.
  * <pre>Full description: {@link acceptBusinessContract}</pre>
  * @param {callback} businessContractUpdate - Runs update.<pre>Full description: {@link businessContractUpdate}</pre>
  */
 businesscontractsRouter.put("/:businessContractId/:userId/accept",authenticateToken,needsToBeAgency,businessContractExists,acceptBusinessContract,businessContractUpdate)
 /**
  * Route for agency to decline BusinessContract with Business or Worker.
  * With this route agency can decline BusinessContract request from Business or Worker.
  * UserId is deleted from requestContract.
  * @name PUT /businesscontracts/:businessContractId/:userId/decline
  * @function
  * @memberof module:controllers/businesscontracts~businesscontractsRouter
  * @inner
  * @param {String} path - Express path.
  * @param {callback} authenticateToken - Decodes token.
  * @param {callback} needsToBeAgency - Checks that user is Agency.
  * <pre>Full description: {@link needsToBeAgency}</pre>
  * @param {callback} businessContractExists - Checks that BusinessContract exists in database.
  * <pre>Full description: {@link businessContractExists}</pre>
  * @param {callback} declineBusinessContract - Initializes update that removes userid from requestContract object.
  * <pre>Full description: {@link declineBusinessContract}</pre>
  * @param {callback} businessContractUpdate - Runs update.<pre>Full description: {@link businessContractUpdate}</pre>
  */
 businesscontractsRouter.put("/:businessContractId/:userId/decline",authenticateToken, needsToBeAgency, businessContractExists, declineBusinessContract, businessContractUpdate)

/**
 * TODO:
 * route jolla voi poistaa solmitun BusinessContractin eli poistaa madeContract objectista idn jommasta kummasta array listasta.
 */
export default businesscontractsRouter
