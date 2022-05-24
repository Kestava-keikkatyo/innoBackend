import express from "express";
import { isAdmin } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import {
  deleteTopic,
  getAllTopics,
  getTopicById,
  postTopic,
  updateTopic,
} from "../middleware/topicMiddleware";
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

/**
 * Route for admin to get all topics.
 * @openapi
 * /topic/all:
 *   get:
 *     summary: Route for admin to get all topics
 *     description: Need to be logged in as a admin.
 *     tags: [Topic, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all found topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Topic"
 *       "404":
 *         description: No topics are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No topics found
 */
topicRouter.get("/all", tokenAuthentication, isAdmin, getAllTopics);

/**
 * Route for admin to get a topic by its id
 * @openapi
 * /topic/any/{id}:
 *   get:
 *     summary: Route for admin to get a topic by its id
 *     description: Must be logged in as admin.
 *     tags: [Topic, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested topic.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested topic.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Topic"
 *       "404":
 *         description: No topic was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No topic with ID {id} found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
topicRouter.get("/any/:id", tokenAuthentication, isAdmin, getTopicById);

/**
 * Route for admin to update a topic.
 * @openapi
 * /topic/update/{id}:
 *   put:
 *     summary: Route for admin to update a topic.
 *     description: Must be logged in as an admin.
 *     tags: [Topic, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the topic to be updated.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Topic"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Topic"
 *       "404":
 *         description: A topic with the specified ID was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
topicRouter.put("/update/:id", tokenAuthentication, isAdmin, updateTopic);

/**
 * Route for admin to delete a topic
 * @openapi
 * /topic/delete/{id}:
 *   delete:
 *     summary: Route for admin to delete a topic.
 *     description: Must be logged in as an admin.
 *     tags: [Topic, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the topic to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Topic was deleted successfully.
 *       "404":
 *         description: The topic with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Topic is not existing.
 */
topicRouter.delete("/delete/:id", tokenAuthentication, isAdmin, deleteTopic);

export default topicRouter;
