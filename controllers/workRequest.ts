import express from "express";
import { isAgency, isBusiness } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import {
  getMyWorkRequests,
  getReceivedWorkRequests,
  getWorkRequestById,
  postWorkRequest,
  updateWorkRequest,
} from "../middleware/workRequestMiddleware";

const workRequestRouter = express.Router();

/**
 * Route for business to send a work request.
 * @openapi
 * /workRequest/:
 *   post:
 *     summary: Route for business to send a work request.
 *     description: Must be logged in as a user of type business.
 *     tags: [Workrequest, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/"
 *     responses:
 *       "200":
 *         description: Work request was sent. Returns sent work request object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkRequest"
 *       "400":
 *         description: Failed to handle the process
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Failed to send the work request
 */
workRequestRouter.post("/", tokenAuthentication, isBusiness, postWorkRequest);

/**
 * Route for users of type business to get their own work requests
 * @openapi
 * /workRequest/myWorkRequests:
 *   get:
 *     summary: Route for users of type business to get their own work requests
 *     description: Must be logged in as a user of type business.
 *     tags: [WorkRequets, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns user's work requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/WorkRequest"
 *       "404":
 *         description: The requested workrequests are not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No work requests found
 */
workRequestRouter.get("/myWorkRequests", tokenAuthentication, isBusiness, getMyWorkRequests);

workRequestRouter.get("/received", tokenAuthentication, isAgency, getReceivedWorkRequests);

/**
 * Route for user of role business to get own work request by its id
 * @openapi
 * /workRequest/any/{id}:
 *   get:
 *     summary: Route for user of role business to get own work request by its id
 *     description: Must be logged in as a user of role business.
 *     tags: [WorkRequest, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the defined work request.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the defined work request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkRequest"
 *       "404":
 *         description: The work request is not existng.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No work request was found
 */
workRequestRouter.get("/any/:id", tokenAuthentication, isBusiness, getWorkRequestById);

/**
 * Route for user of role business to update own work request.
 * @openapi
 * /workRequest/update/{id}:
 *   put:
 *     summary: Route for user of role business to update own work request.
 *     description: Must be logged in as a business.
 *     tags: [WorkRequest, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the work request to be updated.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkRequest"
 *     responses:
 *       "200":
 *         description: Returns the updated work request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkRequest"
 *       "404":
 *         description: No work request was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: This work request is not existing
 */
workRequestRouter.put("/update/:id", tokenAuthentication, isBusiness, updateWorkRequest);

export default workRequestRouter;
