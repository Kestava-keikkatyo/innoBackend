import express from "express";
import authenticateToken from "../utils/auhenticateToken";
import {} from "../utils/jobVacanciesMiddleware";
import {
  getJobDocumentById,
  getJobDocuments,
  getJobDocumentsForAgency,
  postJobDocument,
  updateJobDocument,
  deleteJobDocument,
} from "../middleware/jobMiddleware";
import { isAdmin, isAgency, isWorker } from "../utils/authJwt";

const jobRouter = express.Router();

/**
 * Route for agency to add a new job. Job object is given in body according to its schema model.
 * @openapi
 * /jobs/:
 *   post:
 *     summary: Route for agency to add a new job.
 *     description: Must be logged in as an agency.
 *     tags: [Jobs, Agency]
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
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobRouter.post("/", authenticateToken, isAgency, postJobDocument);

/**
 * Route for workers to get all available jobs.
 * @openapi
 * /job/allJobsForWorker:
 *   get:
 *     summary: Route for workers to get all available jobs
 *     description: Need to be logged in as a worker.
 *     tags: [Jobs, Worker]
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
 *                 $ref: "#/components/schemas/Job"
 *       "404":
 *         description: No jobs are existing
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
  isWorker,
  getJobDocuments
);

/**
 * Route for worker to get a job by its id
 * @openapi
 * /job/jobForWorker/{id}:
 *   get:
 *     summary: Route for worker to get a job by its id
 *     description: Must be logged in as worker.
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
 *         description: ID of the requested job.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested job.
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
 *               message:No job with ID {id} found
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
  isWorker,
  getJobDocumentById
);

/**
 * Route for agencies to get their own jobs
 * @openapi
 * /job/allJobsForAgency:
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
 *         description: The requested jobs are not found.
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
  isAgency,
  getJobDocumentsForAgency
);

/**
 * Route for agency to get own job by its id
 * @openapi
 * /job/jobForAgency/{id}:
 *   get:
 *     summary: Route for agency to get own job by its id
 *     description: Must be logged in as an agency.
 *     tags: [Job, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested job.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested job.
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
 *               message:No job with ID {id} found
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
  isAgency,
  getJobDocumentById
);

/**
 * Route for admin to get all jobs.
 * @openapi
 * /job/allJobsForAdmin:
 *   get:
 *     summary: Route for admin to get all jobs
 *     description: Need to be logged in as a admin.
 *     tags: [Jobs, Admin]
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
 *                 $ref: "#/components/schemas/Job"
 *       "404":
 *         description: No jobs are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No jobs found
 */
jobRouter.get("/allJobsForAdmin", authenticateToken, isAdmin, getJobDocuments);

/**
 * Route for admin to get job by its id
 * @openapi
 * /job/jobForAdmin/{id}:
 *   get:
 *     summary: Route for admin to get job by its id
 *     description: Must be logged in as admin.
 *     tags: [Job, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested job.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested job.
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
 *               message:No job with ID {id} found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobRouter.get(
  "/jobForAdmin/:id",
  authenticateToken,
  isAdmin,
  getJobDocumentById
);

/**
 * Route for agency to update own job.
 * @openapi
 * /job/jobUpdateForAgency/{id}:
 *   put:
 *     summary: Route for agency to update own job
 *     description: Must be logged in as an agency.
 *     tags: [Job, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the job which agency wants to update.
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
  isAgency,
  updateJobDocument
);

/**
 * Route for agency to delete own job
 * @openapi
 * /job/jobDeleteForAgency/{id}:
 *   delete:
 *     summary: Route for agency to delete own job
 *     description: Must be logged in as an agency.
 *     tags: [Job, Agency]
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
 *         description: Job was deleted successfully.
 *       "404":
 *         description: The job with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No job was found with the requested ID {id}
 */
jobRouter.delete(
  "/jobDeleteForAgency/:id",
  authenticateToken,
  isAgency,
  deleteJobDocument
);

export default jobRouter;
