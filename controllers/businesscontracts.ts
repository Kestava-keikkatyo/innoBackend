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
import express, { NextFunction, Request, Response } from "express"
import authenticateToken from "../utils/auhenticateToken"
import BusinessContract from "../models/BusinessContract"
import {
  needsToBeAgency,
  needsToBeAgencyBusinessOrWorker,
  needsToBeBusinessOrWorker
} from "../utils/middleware"
import { error as _error } from "../utils/logger"
import { buildPaginatedObjectFromArray } from "../utils/common"
import { CallbackError, DocumentDefinition, Types } from "mongoose"
import { IBaseBody } from "../objecttypes/otherTypes";
import { IBusinessContractDocument } from "../objecttypes/modelTypes";
import {
  initBusinessContractFormUpdate, initBusinessContractAddUpdate, addContractToBusinessContract, businessContractExists, businessContractIncludesUser,
  businessContractUpdate, declineBusinessContract, makeBusinessContract, businessContractAgencyUpdate, initBusinessContractSendUpdate, initBusinessContractDeclineUpdate, initBusinessContractAcceptUpdate, initBusinessContractSendBackUpdate
} from "../utils/businessContractMiddleware";
import Agency from "../models/Agency"

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
    let projection: {} = {}
    let populatePath: string = ''
    //Check that page and limit exist and are not below 1
    if (page < 1 || !page) {
      page = 1
    }
    if (limit < 1 || !limit) {
      limit = 5
    }
    //Which id is in question
    //If use is Agency we can use find() to find BusinessContracts.
    if (body.agency) {
      array = { _id: { $in: body.agency.businessContracts } }
      populatePath = 'madeContracts.businesses.businessId madeContracts.workers.workerId requestContracts.businesses.businessId '
        + 'requestContracts.workers.workerId pendingContracts.workers.workerId pendingContracts.businesses.businessId '
        + 'receivedContracts.businesses.businessId receivedContracts.workers.workerId'
      return BusinessContract.find(array,
        projection,
        { lean: true }).populate({ path: populatePath, select: "name email createdAt userType" }).exec((error: CallbackError, result: DocumentDefinition<IBusinessContractDocument>[]) => {
          if (error) {
            return res.status(500).send(error.message)
          } else if (result.length === 0) {
            return res.status(404).send({ message: "Couldn't find any BusinessContracts" })
          } else {
            return res.status(200).send(buildPaginatedObjectFromArray(page, limit, result))
          }
        })
    }
    //If Business is using this route use aggregate to return correct BusinessContracts.
    else if (body.business) {
      return BusinessContract.aggregate([
        { $match: { _id: { "$in": body.business.businessContracts } } },
        {
          $group: {
            _id: "$_id",
            agency: { "$first": "$agency" },
            requestContracts: { "$first": "$requestContracts.businesses" },
            pendingContracts: { "$first": "$pendingContracts.businesses" },
            madeContracts: { "$first": "$madeContracts.businesses" },
            receivedContracts: { "$first": "$receivedContracts.businesses" }
          }
        },
        {
          $project: {
            pendingContracts: {
              $first: {
                $filter: {
                  input: "$pendingContracts",
                  as: "pendingExists",
                  cond: { $eq: ["$$pendingExists.businessId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            requestContracts: {
              $first: {
                $filter: {
                  input: "$requestContracts",
                  as: "requestExists",
                  cond: { $eq: ["$$requestExists.businessId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            madeContracts: {
              $first: {
                $filter: {
                  input: "$madeContracts",
                  as: "madeExists",
                  cond: { $eq: ["$$madeExists.businessId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            receivedContracts: {
              $first: {
                $filter: {
                  input: "$receivedContracts",
                  as: "receivedExists",
                  cond: { $eq: ["$$receivedExists.businessId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            agency: 1
          }
        }
      ]).exec((err: CallbackError, result) => {
        if (err) {
          return res.status(500).send(err)
        } else if (!result) {
          return res.status(404).send({ error: "Aggregate failed, result was empty." })
        } else {
          return Agency.populate(result, {
            path: "agency", select: "name email profile createdAt", populate: {
              path: 'profile', select: "profilePicture website phone streetAddress city zipCode"
            }
          }, (err: CallbackError, result) => {
            if (err) {
              return res.status(500).send(err)
            } else if (!result) {
              return res.status(404).send({ error: "Populate failed, result was empty." })
            } else {
              return res.status(200).send(buildPaginatedObjectFromArray(page, limit, result))
            }
          })
        }
      })
    }
    //If Worker is using this route use aggregate to return correct BusinessContracts.
    else if (body.worker) {
      return BusinessContract.aggregate([
        { $match: { _id: { "$in": body.worker.businessContracts } } },
        {
          $group: {
            _id: "$_id",
            agency: { "$first": "$agency" },
            requestContracts: { "$first": "$requestContracts.workers" },
            pendingContracts: { "$first": "$pendingContracts.workers" },
            madeContracts: { "$first": "$madeContracts.workers" },
            receivedContracts: { "$first": "$receivedContracts.workers" }
          }
        },
        {
          $project: {
            pendingContracts: {
              $first: {
                $filter: {
                  input: "$pendingContracts",
                  as: "pendingExists",
                  cond: { $eq: ["$$pendingExists.workerId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            requestContracts: {
              $first: {
                $filter: {
                  input: "$requestContracts",
                  as: "requestExists",
                  cond: { $eq: ["$$requestExists.workerId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            madeContracts: {
              $first: {
                $filter: {
                  input: "$madeContracts",
                  as: "madeExists",
                  cond: { $eq: ["$$madeExists.workerId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            receivedContracts: {
              $first: {
                $filter: {
                  input: "$receivedContracts",
                  as: "receivedExists",
                  cond: { $eq: ["$$receivedExists.workerId", Types.ObjectId(res.locals.decoded.id)] }
                }
              }
            },
            agency: 1
          }
        }
      ]).exec((err: CallbackError, result) => {
        if (err) {
          return res.status(500).send(err)
        } else if (!result) {
          return res.status(404).send({ error: "Aggregate failed, result was empty." })
        } else {
          return Agency.populate(result, {
            path: "agency", select: "name email profile createdAt", populate: {
              path: 'profile', select: "profilePicture website phone streetAddress city zipCode"
            }
          }, (err: CallbackError, result) => {
            if (err) {
              return res.status(500).send(err)
            } else if (!result) {
              return res.status(404).send({ error: "Populate failed, result was empty." })
            } else {
              return res.status(200).send(buildPaginatedObjectFromArray(page, limit, result))
            }
          })
        }
      })
    } else {
      return res.status(401).send({ message: "Token didn't have any users." })
    }
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
 * /businesscontracts/send/{businessContractId}/:
 *   put:
 *     summary: Route to send businessContract request from business/worker back to agency.
 *     description: |
 *       Must be logged in as an Worker or Business. Pulls userId and formId from
 *       pendingContracts.businesses and pushes userId and formId to requestContracts.businesses.
 *     tags: [Worker, Business, BusinessContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 */
businesscontractsRouter.put("/send/:businessContractId/", authenticateToken, needsToBeBusinessOrWorker, businessContractExists, initBusinessContractSendUpdate, businessContractUpdate)
/**
 * @openapi
 * /businesscontracts/refuse/{businessContractId}/:
 *   put:
 *     summary: Route to refuse businessContract request from agency.
 *     description: |
 *       Must be logged in as an Worker or Business.
 *       Pulls userId and formId from pendingContracts.businesses or receivedContracts.businesses.
 *     tags: [Worker, Business, BusinessContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 */
businesscontractsRouter.put("/refuse/:businessContractId/", authenticateToken, needsToBeBusinessOrWorker, businessContractExists, initBusinessContractDeclineUpdate, businessContractUpdate)
/**
 * @openapi
 * /businesscontracts/{businessContractId}/{userId}/accept:
 *   put:
 *     summary: Route to accept businessContract that was accepted by Worker or Business.
 *     description: |
 *       Must be logged in as Agency. Business or Worker sends accepted BusinessContract
 *       back to Agency. Agency can then use this route to accept BusinessContract. Route moves
 *       userId and formId from requestContracts.businesses array to madeContracts.businesses array.
 *     tags: [Agency, BusinessContract]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 */
businesscontractsRouter.put("/:businessContractId/:userId/accept", authenticateToken, needsToBeAgency, businessContractExists, initBusinessContractAcceptUpdate, businessContractAgencyUpdate)
/**
 * @openapi
 * /businesscontracts/{businessContractId}/{userId}/sendBack:
 *  put:
 *    summary: Route to send back businesscontract to Worker or Business.
 *    description: |
 *      Must be logged in as Agency. Route is used when Agency is not satisfied
 *      by contract that was sent by Business or Worker. With this route Agency
 *      can send contract back.
 *    tags: [Agency, BusinessContract]
 *    parameters:
 *      - in: header
 *        name: x-access-token
 *        description: The token you get when logging in is used here. Used to authenticate the user.
 *        required: true
 *        schema:
 *          $ref: "#/components/schemas/AccessToken"
 */
businesscontractsRouter.put("/:businessContractId/:userId/sendBack", authenticateToken, needsToBeAgency, businessContractExists, initBusinessContractSendBackUpdate, businessContractAgencyUpdate)
/**
* @openapi
* /businesscontracts/{businessContractId}/saveForm:
*   put:
*     summary: Route to change formId inside pendingContracts.businesses or pendingContracts.workers.
*     description: |
*       Must be logged in as Agency.
*     tags: [Agency, BusinessContract]
*     parameters:
*       - in: header
*         name: x-access-token
*         description: The token you get when logging in is used here. Used to authenticate the user.
*         required: true
*         schema:
*           $ref: "#/components/schemas/AccessToken"
*/
businesscontractsRouter.put("/:businessContractId/saveForm", authenticateToken, needsToBeBusinessOrWorker, businessContractExists, initBusinessContractFormUpdate, businessContractUpdate)
/**
 * @openapi
 * /businesscontracts/add/{businessContractId}/{agencyId}:
 *   put:
 *     summary: Route to add worker or business to BusinessContract.
 *     description: |
 *       This route is used when worker or business is first to send BusinessContract
 *       request to Agency. Route adds usersId to BusinessContractDocumentObjects receivedContracts fields
 *       Business or Worker array.
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
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
businesscontractsRouter.put("/add/:businessContractId/:agencyId", authenticateToken, needsToBeBusinessOrWorker, businessContractExists, addContractToBusinessContract, businessContractUpdate)
/**
 * @openapi
 * /businesscontracts/{businessContractId}/{userId}/add:
 *   put:
 *     summary: Route for agency to add BusinessContract with Business or Worker
 *     description: |
 *       Must be logged in as an agency.
 *       This route is used to make BusinessContract with Business or Worker.
 *       Route adds userId to BusinessContractDocumentObjects pendingContracts.
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
 *         description: ID of the user in question.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6092db60b945cc2528cad0b6
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
businesscontractsRouter.put("/:businessContractId/:userId/add", authenticateToken, needsToBeAgency, businessContractExists, initBusinessContractAddUpdate, businessContractAgencyUpdate)
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
 *         description: ID of the user in question.
 *         required: true
 *         schema:
 *           type: string
 *           example: 6092db60b945cc2528cad0b6
 *     responses:
 *       # TODO Check responses from middleware and list them here.
 */
businesscontractsRouter.put("/:businessContractId/:userId/decline", authenticateToken, needsToBeAgency, businessContractExists, declineBusinessContract, businessContractAgencyUpdate)

/**
 * TODO:
 * route jolla voi poistaa solmitun BusinessContractin eli poistaa madeContract objectista idn jommasta kummasta array listasta.
 */
export default businesscontractsRouter
