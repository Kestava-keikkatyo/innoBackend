import express from "express";
import { isAdmin } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { postTopic } from "../middleware/topicMiddleware";
const topicRouter = express.Router();

/**
 * Route for admin to add a new topic.
 * @openapi
 * /topics/:
 *   post:
 *     summary: Route for admin to add a new topic.
 *     description: Must be logged in as an admin.
 *     tags: [Topic, Admin]
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
 *             $ref: "#/components/schemas/Topic"
 *     responses:
 *       "200":
 *         description: Topic added. Returns added topic object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Topic"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
topicRouter.post("/create", tokenAuthentication, isAdmin, postTopic);

export default topicRouter;
