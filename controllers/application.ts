import express from "express";
import { isAgency, isWorker } from "../utils/authJwt";
import {
  getAllMyApplications,
  getApplicationById,
  getMyApplication,
  postApplication,
} from "../middleware/applicationMiddleware";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";

const applicationRouter = express.Router();

/**
 * Route for worker to apply to a job. Application object is given in body according to its schema model.
 * @openapi
 * /applications/:
 *   post:
 *     summary: Route for worker to send an application.
 *     description: Must be logged in as an worker.
 *     tags: [Applications, Worker]
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
 *             $ref: "#/components/schemas/Application"
 *     responses:
 *       "200":
 *         description: Application submitted. Returns submitted application object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Application"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
applicationRouter.post("/", tokenAuthentication, isWorker, postApplication);

/**
 * Route for user of role agency to get an application by its id
 * @openapi
 * /application/any/{id}:
 *   get:
 *     summary: Route for user of role agency to get an application by its id
 *     description: Must be logged in as an agency.
 *     tags: [Application, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested application.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested application.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Application"
 *       "404":
 *         description: No application was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No application was found
 */
applicationRouter.get("/any/:id", tokenAuthentication, isAgency, getApplicationById);

/**
 * Route for workers to get their own applications
 * @openapi
 * /application/myApplications:
 *   get:
 *     summary: Route for workers to get their own applications
 *     description: Must be logged in as an worker.
 *     tags: [Application, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns worker's applications.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Application"
 *       "404":
 *         description: The requested applications are not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No applications found
 */
applicationRouter.get("/myApplications", tokenAuthentication, isWorker, getAllMyApplications);

/**
 * Route for user of role worker to get own application by its id
 * @openapi
 * /application/my/{id}:
 *   get:
 *     summary: Route for user of role worker to get own application by its id
 *     description: Must be logged in as a user of role worker.
 *     tags: [Application, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested application.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested application.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Application"
 *       "404":
 *         description: The requested application is not existng.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No appliaction was found
 */
applicationRouter.get("/my/:id", tokenAuthentication, isWorker, getMyApplication);

export default applicationRouter;
