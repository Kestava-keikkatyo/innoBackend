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
import { needsToBeAgency,
  needsToBeAgencyBusinessOrWorker} from "../utils/middleware"
import { error as _error} from "../utils/logger"
import { buildPaginatedObjectFromArray } from "../utils/common"
import {CallbackError, DocumentDefinition} from "mongoose"
import {IBaseBody} from "../objecttypes/otherTypes";
import {IBusinessContractDocument} from "../objecttypes/modelTypes";
import {
  acceptBusinessContract, addContractToBusinessContract, businessContractExists, businessContractIncludesUser,
  businessContractUpdate, declineBusinessContract, makeBusinessContract, businessContractAgencyUpdate
} from "../utils/businessContractMiddleware";

const businesscontractsRouter = express.Router()

/**
 * @openapi
 * /businesscontracts/{businessContractId}:
 *   get:
 *     summary: Route for getting one specific business contract
 *     description: Requires user logged in as a participant of this specific business contract.
 *     tags: [BusinessContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: businessContractId
 *         description: ID of the business contract which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 601f3fdf130ad04ad091eac0
 *     responses:
 *       "200":
 *         description: Returns the full business contract if logged in as agency. If logged in as business or worker, returns the ID of the business contract and the ID of the agency it is made with.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: "#/components/schemas/BusinessContract"
 *                 - type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     agency:
 *                       type: string
 *                   example:
 *                     id: 601f3fdf130ad04ad091eac0
 *                     agency: 6018012a88b8375630a6a3c0
 *       "403":
 *         description: Not allowed to view a business contract user is not a part of.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: User who is trying to use this route is not in the business contract
 */
businesscontractsRouter.get("/:businessContractId", authenticateToken, needsToBeAgencyBusinessOrWorker, businessContractExists, businessContractIncludesUser,
  async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
    const { body } = req
    try {
      if (body.userInBusinessContract) {
         //Which id is in question
        if (body.agency !== undefined) {
          return res.status(200).send(body.businessContract)
        }
        else if (body.business !== undefined) {
          return res.status(200).send({ "id": body.businessContract?._id, "agency": body.businessContract?.agency })
        }
        else if (body.worker !== undefined) {
          return res.status(200).send({ "id": body.businessContract?._id, "agency": body.businessContract?.agency })
        }
      } else {
        return res.status(403).send({ message: "User who is trying to use this route is not in the business contract" })
      }
    } catch (exception) {
      _error(exception.message)
      return next(exception)
    }
  }
)

/**
 * @openapi
 * /businesscontracts:
 *   get:
 *     summary: Route for getting all of the user's business contracts
 *     tags: [BusinessContract]
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
 *         description: Returns all of the user's business contracts, paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedBusinessContract"
 *       "401":
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Token didn't have any users.
 *       "404":
 *         description: User has no business contracts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Couldn't find any BusinessContracts
 *       "500":
 *         description: An error occurred when calling database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
businesscontractsRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
    const { query, body } = req
    try {
      //Initialise page, limit, myId, model
      let page: number = parseInt(query.page as string, 10)
      let limit: number = parseInt(query.limit as string, 10)
      let array: {}
      let projection: string = ''
      let populatePath: string = ''
      let populateFields: string = ''
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
        populatePath = 'madeContracts.businesses madeContracts.workers requestContracts.businesses requestContracts.workers pendingContracts.workers pendingContracts.businesses'
        populateFields = 'name email userType'
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
        return res.status(401).send({ message: "Token didn't have any users." })
      }
      return await BusinessContract.find(array,
        projection,
        { lean: true }).populate(populatePath,populateFields).exec((error: CallbackError, result: DocumentDefinition<IBusinessContractDocument>[]) => {
          if (error) {
            return res.status(500).send(error.message)
          } else if (result.length === 0) {
            return res.status(404).send({ message: "Couldn't find any BusinessContracts" })
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
 * /businesscontracts:
 *   post:
 *     summary: Route to initialize BusinessContract object for agency
 *     description: |
 *       Must be logged in as an agency.
 *       This route is ran when Agency first makes an account on the platform.
 *     tags: [Agency, BusinessContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
 businesscontractsRouter.post("/", authenticateToken, needsToBeAgency, makeBusinessContract)
 /**
  * @openapi
  * /businesscontracts/{businessContractId}/add:
  *   put:
  *     summary: Route to add worker or business to BusinessContract
  *     description: |
  *       All users can use this route. If Business or Worker uses this route
  *       usersId is added to BusinessContracts requestContract object.
  *       If Agency uses this route agency must provide userId in body, # TODO What is userId referencing here? workerId?
  *       and UserId is added to madeContracts object.
  *     tags: [BusinessContract]
  *     parameters:
  *       - in: header
  *         name: x-access-token
  *         description: The token you get when logging in is used here. Used to authenticate the user.
  *         required: true
  *         schema:
  *           $ref: "#/components/schemas/AccessToken"
  *       - in: path
  *         name: businessContractId
  *         description: ID of the business contract in question.
  *         required: true
  *         schema:
  *           type: string
  *           example: 601f3fdf130ad04ad091eac0
  *     requestBody:
  *       description: If logged in as an agency, you need to provide a userId (TODO workerId?) in the body.
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               userId: #TODO workerId?
  *                 type: string
  *     responses:
  *       # TODO Check responses from middleware and list them here.
  */
 businesscontractsRouter.put("/:businessContractId/add", authenticateToken, needsToBeAgencyBusinessOrWorker, businessContractExists, addContractToBusinessContract, businessContractUpdate)
 /**
  * @openapi
  * /businesscontracts/{businessContractId}/{userId}/accept:
  *   put:
  *     summary: Route for agency to accept BusinessContract with Business or Worker
  *     description: |
  *       Must be logged in as an agency.
  *       This route can be used when agency has users in BusinessContract's requestContract object.
  *       UserId is deleted from requestContract object and moved to madeContracts object. # TODO There seems to be quite a few "userId"s left in the comments. Shouldn't they be workerIds?
  *     tags: [Agency, BusinessContract]
  *     parameters:
  *       - in: header
  *         name: x-access-token
  *         description: The token you get when logging in is used here. Used to authenticate the user.
  *         required: true
  *         schema:
  *           $ref: "#/components/schemas/AccessToken"
  *       - in: path
  *         name: businessContractId
  *         description: ID of the business contract in question.
  *         required: true
  *         schema:
  *           type: string
  *           example: 601f3fdf130ad04ad091eac0
  *       - in: path
  *         name: userId
  *         description: ID of the user (TODO worker?) in question.
  *         required: true
  *         schema:
  *           type: string
  *           example: 6092db60b945cc2528cad0b6
  *     responses:
  *       # TODO Check responses from middleware and list them here.
  */
 businesscontractsRouter.put("/:businessContractId/:userId/accept", authenticateToken, needsToBeAgency, businessContractExists, acceptBusinessContract, businessContractAgencyUpdate)
 /**
  * @openapi
  * /businesscontracts/{businessContractId}/{userId}/decline:
  *   put:
  *     summary: Route for agency to decline BusinessContract with Business or Worker
  *     description: |
  *       Must be logged in as an agency
  *       With this route agency can decline BusinessContract request from Business or Worker.
  *       UserId is deleted from requestContract.
  *     tags: [Agency, BusinessContract]
  *     parameters:
  *       - in: header
  *         name: x-access-token
  *         description: The token you get when logging in is used here. Used to authenticate the user.
  *         required: true
  *         schema:
  *           $ref: "#/components/schemas/AccessToken"
  *       - in: path
  *         name: businessContractId
  *         description: ID of the business contract in question.
  *         required: true
  *         schema:
  *           type: string
  *           example: 601f3fdf130ad04ad091eac0
  *       - in: path
  *         name: userId
  *         description: ID of the user (TODO worker?) in question.
  *         required: true
  *         schema:
  *           type: string
  *           example: 6092db60b945cc2528cad0b6
  *     responses:
  *       # TODO Check responses from middleware and list them here.
  */
 businesscontractsRouter.put("/:businessContractId/:userId/decline",authenticateToken, needsToBeAgency, businessContractExists, declineBusinessContract, businessContractAgencyUpdate)

/**
 * TODO:
 * route jolla voi poistaa solmitun BusinessContractin eli poistaa madeContract objectista idn jommasta kummasta array listasta.
 */
export default businesscontractsRouter
