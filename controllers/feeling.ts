import express from "express";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { getMyFeelings, postFeeling, getAllFeelings } from "../middleware/feelingMiddleware";
import { isWorker } from "../utils/authJwt";
const feelingRouter = express.Router();

/**
 * Route for user of role worker to post feeling.
 * @openapi
 * /feeling/send:
 *   post:
 *     summary: Route for user of role worker to post feeling
 *     description: Must be logged in as user of role worker.
 *     tags: [Feeling, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the user to post feeling.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Feeling"
 *     responses:
 *       "200":
 *         description: Feeling posted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Feeling"
 *       "404":
 *         description: Failed to post feeling.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
feelingRouter.post("/send/", tokenAuthentication, isWorker, postFeeling);

/**
 * Route for user of role worker to get own feelings
 * @openapi
 * /feeling/my:
 *   get:
 *     summary: Route for user of role worker to get own feelings
 *     description: Must be logged in as user of role worker.
 *     tags: [Feeling, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested user.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Feeling"
 *       "404":
 *         description: No feelings found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No feelings found
 */
feelingRouter.get("/my", tokenAuthentication, getMyFeelings);

feelingRouter.get("/allFeelings", tokenAuthentication, getAllFeelings);

export default feelingRouter;
