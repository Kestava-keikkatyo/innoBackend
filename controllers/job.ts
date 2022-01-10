import express from "express";
import authenticateToken from "../utils/auhenticateToken";
import { needsToBeAgency, needsToBeWorker } from "./../utils/middleware";
import {} from "../utils/jobVacanciesMiddleware";
import {
  getJobDocumentById,
  getJobDocuments,
  getJobDocumentsForAgency,
  postJobDocument,
  updateJobDocument,
  deleteJobDocument,
} from "../middleware/jobMiddleware";

const jobRouter = express.Router();

/**
 * Route for agency to add a new job. Job object is given in body according to its schema model.
 * @openapi
 * /jobs/:
 *   post:
 *     summary: Route for agency to add a new job.
 *     description: Must be logged in as an agency.
 *     tags: [Job, Agency]
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
 *             $ref: "#/components/schemas/Job"
 *     responses:
 *       "200":
 *         description: Job added. Returns added job object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Job"
 *        "404":
 *         description: Failed to create a job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Failed to create a job
 */
jobRouter.post("/", authenticateToken, needsToBeAgency, postJobDocument);

/**
 * Route for workers to get all available jobs.
 * @openapi
 * /jobs/allJobsForWorker:
 *   get:
 *     summary: Route for workers to get all available jobs
 *     description: Need to be logged in as a worker.
 *     tags: [Job, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/JobVacancy"
 *       "404":
 *         description: No jobs found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No jobs found
 */
jobRouter.get(
  "/allJobsForWorker",
  authenticateToken,
  needsToBeWorker,
  getJobDocuments
);

/**
 * Route for worker to get job by its id
 * @openapi
 * /jojs/jobForWorker/{id}:
 *   get:
 *     summary: Route for worker to get job by its id
 *     description: Must be logged in as an worker.
 *     tags: [Jobs, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the job which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the required job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/JobVacancy"
 *       "404":
 *         description: No job was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No job with ID {id} found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobRouter.get(
  "/jobForWorker/:id",
  authenticateToken,
  needsToBeWorker,
  getJobDocumentById
);

/**
 * Route for agencies to get their own jobs
 * @openapi
 * /jobs/allJobsForAgency:
 *   get:
 *     summary: Route for agencies to get their own jobs
 *     description: Must be logged in as an agency.
 *     tags: [Jobs, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns agency's jobs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Job"
 *       "404":
 *         description: Jobs not found for the agency in question.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No jobs found
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobRouter.get(
  "/allJobsForAgency",
  authenticateToken,
  needsToBeAgency,
  getJobDocumentsForAgency
);

/**
 * Route for agency to get own job by its id
 * @openapi
 * /jobs/jobForAgency/{id}:
 *   get:
 *     summary: Route for agency to get own job by its id
 *     description: Must be logged in as an agency.
 *     tags: [Jobs, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the job which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the required job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/JobVacancy"
 *       "404":
 *         description: No job was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No job with ID {id} found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobRouter.get(
  "/jobForAgency/:id",
  authenticateToken,
  needsToBeAgency,
  getJobDocumentById
);

/**
 * Route for agency to update own job.
 * @openapi
 * /jobs/jobUpdateForAgency/{id}:
 *   put:
 *     summary: Route for agency to update own job
 *     description: Must be logged in as an agency.
 *     tags: [Jobs, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the job vacancy which agency wants to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Job"
 *     responses:
 *       "200":
 *         description: Returns the updated job.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Job"
 *       "404":
 *         description: No job was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No job with ID {id} found
 */
jobRouter.put(
  "/jobUpdateForAgency/:id",
  authenticateToken,
  needsToBeAgency,
  updateJobDocument
);

/**
 * Route for agency to delete own job
 * @openapi
 * /jobs/jobDeleteForAgency/{id}:
 *   delete:
 *     summary: Route for agency to delete own job
 *     description: Must be logged in as an agency.
 *     tags: [Jobs, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the job which we want to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Job deleted successfully.
 *       "404":
 *         description: No job was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: job with ID {id} is not existing
 */
jobRouter.delete(
  "/jobDeleteForAgency/:id",
  authenticateToken,
  needsToBeAgency,
  deleteJobDocument
);

export default jobRouter;
