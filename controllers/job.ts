import express from "express";
import {
  getJobById,
  getAllJobs,
  postJob,
  updateJob,
  deleteJob,
  getMyJobs,
  addApplicant,
  updateJobStatus,
} from "../middleware/jobMiddleware";
import {
  isAdmin,
  isAgency,
  isWorker,
  isWorkerOrBusinessOrAgency,
} from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
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
 *       "400":
 *         description: Failed to handle the process
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Failed to create a job
 */
jobRouter.post("/", tokenAuthentication, isAgency, postJob);

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
jobRouter.get("/allJobsForWorker", tokenAuthentication, isWorker, getAllJobs);

/**
 * Route for worker or agency to get a job by its id
 * @openapi
 * /job/any/{id}:
 *   get:
 *     summary: Route for worker or agency to get a job by its id
 *     description: Must be logged in as worker or agency.
 *     tags: [Jobs, Worker, Agency]
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
 *               message:The requested job is not existing
 */
jobRouter.get(
  "/any/:id",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  getJobById
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
 */
jobRouter.get("/allJobsForAgency", tokenAuthentication, isAgency, getMyJobs);

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
jobRouter.get("/allJobsForAdmin", tokenAuthentication, isAdmin, getAllJobs);

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
jobRouter.get("/jobForAdmin/:id", tokenAuthentication, isAdmin, getJobById);

/**
 * Route for agency to update own job.
 * @openapi
 * /job/jobUpdate/{id}:
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
jobRouter.put("/jobUpdate/:id", tokenAuthentication, isAgency, updateJob);

/**
 * Route for worker to apply for a job.
 * @openapi
 * /job/apply/{jobId}/{userId}:
 *   put:
 *     summary: Route for worker to apply for a job.
 *     description: Must be logged in as an worker.
 *     tags: [Job, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: jobId
 *         description: ID of the job which worker wants to apply to.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *       - in: path
 *         name: userId
 *         description: ID of the user who wants to apply.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *       - in: body
 *         name: coverLetter
 *         description: Short cover letter to agency.
 *         required: false
 *         schema:
 *           type: string
 *           example: This is a short description of myself...
 *       - in: body
 *         name: cv
 *         description: Link to the cv or user profile.
 *         required: false
 *         schema:
 *           type: string
 *           example: https://userscv.com
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
  "/apply/:jobId/:userId",
  tokenAuthentication,
  isWorker,
  addApplicant
);

/**
 * Route for agency to delete own job
 * @openapi
 * /job/jobDelete/{id}:
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
jobRouter.delete("/jobDelete/:id", tokenAuthentication, isAgency, deleteJob);

jobRouter.patch(
  "/updateStatus/:Id",
  tokenAuthentication,
  isAgency,
  updateJobStatus
);

export default jobRouter;
