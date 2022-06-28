import express from "express";
import { isAdmin, isWorkerOrBusinessOrAgency } from "../utils/authJwt";
import {
  postFeedback,
  getMyFeedbacks,
  getAllFeddbacks,
  updateFeedback,
  replyFeedback,
  getMyFeedbackById,
  getReceivedFeedbackById,
} from "../middleware/feedbackMiddleware";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";

const feedbackRouter = express.Router();

/**
 * Route for user of role agency, business or worker to send feedback.
 * @openapi
 * /feedback/:
 *   post:
 *     summary: Route for user of role agency, business or worker to send feedback
 *     description: Must be logged in as a user of role agency, business or worker.
 *     tags: [Feedback, Agency, business, Worker]
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
 *             $ref: "#/components/schemas/Feedback"
 *     responses:
 *       "200":
 *         description: Feedback was sent. Returns sent feedback object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Feedback"
 *       "400":
 *         description: Failed to handle the process
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Failed to send feedback
 */
feedbackRouter.post("/", tokenAuthentication, isWorkerOrBusinessOrAgency, postFeedback);

/**
 * Route for user of role agency, business or worker to get own feedbacks
 * @openapi
 * /feedback/allMyFeedbacks:
 *   get:
 *     summary: Route for user of role agency, business or worker to get own feedbacks
 *     description: Must be logged in as a user of role agency, business or worker.
 *     tags: [FeedBack, Agency, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns user's feedbacks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Feedback"
 *       "404":
 *         description: The requested feedbacks are not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No feedbacks found
 */
feedbackRouter.get("/allMyFeedbacks", tokenAuthentication, isWorkerOrBusinessOrAgency, getMyFeedbacks);

/**
 * Route for user of role agency, business or worker to get own posted feedback by its id
 * @openapi
 * /feedback/my/any/{id}:
 *   get:
 *     summary: Route for user of role agency, business or worker to get own posted feedback by its id
 *     description: Must be logged in as user of role agency, business or worker.
 *     tags: [Feedback, Agency, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested feedback.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested feedback.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FeedBack"
 *       "404":
 *         description: No feedback was found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: The requested feedback is not existing
 */
feedbackRouter.get("/my/any/:id", tokenAuthentication, isWorkerOrBusinessOrAgency, getMyFeedbackById);

/**
 * Route for user of role worker, business or agency to get own received feedback by its id
 * @openapi
 * /feedback/received/any/{id}:
 *   get:
 *     summary: Route for user of role worker, business or agency to get own received feedback by its id
 *     description: Must be logged in as a user of role worker, business or agency.
 *     tags: [Feedback, Worker, Business, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the defined feedback.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the defined feedback.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FeedBack"
 *       "404":
 *         description: The feedback is not existng.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No received feedback was found
 */
feedbackRouter.get("/received/any/:id", tokenAuthentication, isWorkerOrBusinessOrAgency, getReceivedFeedbackById);

/**
 * Route for admin to get all feedbacks.
 * @openapi
 * /feedback/all:
 *   get:
 *     summary: Route for admin to get all feedbacks
 *     description: Need to be logged in as a admin.
 *     tags: [Feedbacks, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Feedback"
 *       "404":
 *         description: No feedbacks are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No feedbacks found
 */
feedbackRouter.get("/allFeedbacks", tokenAuthentication, isAdmin, getAllFeddbacks);

/**
 * Route for user to update own feedback.
 * @openapi
 * /feedback/update/{id}:
 *   put:
 *     summary: Route for user to update own feedback.
 *     description: Must be logged in as a user of role worker, agency or business.
 *     tags: [Feedback, User]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the feedback to be updated.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/FeedbBack"
 *     responses:
 *       "200":
 *         description: Returns the updated feedback.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FeedBack"
 *       "404":
 *         description: No feedback was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: This feedback is not existing
 */
feedbackRouter.put("/update/:id", tokenAuthentication, isWorkerOrBusinessOrAgency, updateFeedback);

/**
 * Route for user to reply other users' feedbacks.
 * @openapi
 * /feedback/reply/{id}:
 *   put:
 *     summary: Route for user to reply other users' feedbacks.
 *     description: Must be logged in as a user of role business, agency or worker.
 *     tags: [FeedBack, User]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the feedback to be replied.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/FeedBack"
 *     responses:
 *       "200":
 *         description: Returns the replied feedback.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FeedBack"
 *       "404":
 *         description: No feedback was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: This feedback is not existing
 */
feedbackRouter.put("/reply/:id", tokenAuthentication, isWorkerOrBusinessOrAgency, replyFeedback);

export default feedbackRouter;
