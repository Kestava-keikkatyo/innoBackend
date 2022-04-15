import express from "express";
import authenticateToken from "../utils/auhenticateToken";
import { isAdmin, isWorkerOrBusinessOrAgency } from "../utils/authJwt";
import {
  postFeedback,
  getMyFeedbacks,
  replyFeedback,
  getFeedbackById,
  getAllFeedbacks, getAllFeedbacksToMe,
} from "../middleware/feedbackMiddleware";

const feedbackRouter = express.Router();

/**
 * Route for user to send feedback.
 * @openapi
 * /feedback/:
 *   post:
 *     summary: Route for user to send feedback
 *     description: Must be logged in as a user.
 *     tags: [Feedback,User]
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
 *         description: Feedback sent. Returns sent feedback object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Feedback"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
feedbackRouter.post(
  "/",
  authenticateToken,
  isWorkerOrBusinessOrAgency,
  postFeedback
);

/**
 * Route for user to get own feedbacks
 * @openapi
 * /feedback/allMyFeedbacks:
 *   get:
 *     summary: Route for user to get own feedbacks
 *     description: Must be logged in as a user.
 *     tags: [Feedbacks, User]
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
 *                 $ref: "#/components/schemas/feedback"
 *       "404":
 *         description: The requested feedbacks are not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No feedbacks found
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
feedbackRouter.get(
  "/allMyFeedbacks",
  authenticateToken,
  isWorkerOrBusinessOrAgency,
  getMyFeedbacks
);

/**
 * Route for user to get feedback by its id
 * @openapi
 * /feedback/myFeedback/{id}:
 *   get:
 *     summary: Route for user to get feedback by its id
 *     description: Must be logged in as a user.
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
 *               $ref: "#/components/schemas/Feedback"
 *       "404":
 *         description: No feedback found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No feedback found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
feedbackRouter.get(
  "/:id",
  authenticateToken,
  isWorkerOrBusinessOrAgency,
  getFeedbackById
);

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
feedbackRouter.get(
  "/allFeedbacks",
  authenticateToken,
  isAdmin,
  getAllFeedbacks
);

/**
 * Route for user to get all feedbacks they are target of and feedbacks are non anon.
 * @openapi
 * /feedback/all:
 *   get:
 *     summary: Route for user to get all feedbacks they are target of and feedbacks are non anon
 *     description: Need to be logged in
 *     tags: [Feedbacks, Worker, Agency, Business]
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
feedbackRouter.get(
    "/allFeedbacksToMe",
    authenticateToken,
    isWorkerOrBusinessOrAgency,
    getAllFeedbacksToMe
);

/**
 * Käytetään kun halutaan vastata käyttäjän antamaan palautteeseen.
 */
feedbackRouter.put("/reply", replyFeedback);

export default feedbackRouter;
