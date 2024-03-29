import express from "express";
import {
  getJobById,
  postJob,
  updateJob,
  deleteJob,
  getMyJobs,
  updateJobStatus,
  getJobAds,
  getMyJobById,
  getLatestJobs,
} from "../middleware/jobMiddleware";
import { isAgency, isWorkerOrAdmin } from "../utils/authJwt";
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
 * Route for users of role worker or admin to get all available job ads.
 * @openapi
 * /job/ads:
 *   get:
 *     summary: Route for users or role worker or admin to get all available job ads
 *     description: Need to be logged in as a user of role worker or admin.
 *     tags: [Job, Worker, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found jobads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Job"
 *       "404":
 *         description: No job ads are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No job ads found
 */
jobRouter.get("/ads", tokenAuthentication, isWorkerOrAdmin, getJobAds);

/**
 * Route for users of role worker or admin to get the latest job ads.
 * @openapi
 * /job/latest:
 *   get:
 *     summary: Route for users or role worker or admin to get the latest job ads.
 *     description: Need to be logged in as a user of role worker or admin.
 *     tags: [Job, Worker, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found jobads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Job"
 *       "404":
 *         description: No job ads are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No job ads found
 */
jobRouter.get("/latest", tokenAuthentication, isWorkerOrAdmin, getLatestJobs);

/**
 * Route for user of role agency to get own created job by its id
 * @openapi
 * /job/my/any/{id}:
 *   get:
 *     summary: Route for user of role agency to get own created job by its id
 *     description: Must be logged in as user of role agency.
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
 *         description: No job was found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: The requested job is not existing
 */
jobRouter.get("/my/any/:id", tokenAuthentication, isAgency, getMyJobById);

/**
 * Route for worker or agency to get a job by its id
 * @openapi
 * /job/any/{id}:
 *   get:
 *     summary: Route for user of role worker or admin to get a job by its id
 *     description: Must be logged in as user of role worker or admin.
 *     tags: [Job, Worker, Admin]
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
jobRouter.get("/any/:id", tokenAuthentication, isWorkerOrAdmin, getJobById);

/**
 * Route for agencies to get their own jobs
 * @openapi
 * /job/my:
 *   get:
 *     summary: Route for users of role agency to get their own jobs
 *     description: Must be logged in as a user of role agency.
 *     tags: [Job, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns agency's own jobs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Job"
 *       "404":
 *         description: No jobs are existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No jobs found
 */
jobRouter.get("/my", tokenAuthentication, isAgency, getMyJobs);

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

/**
 * Route for user of role agency to update job status.
 * @openapi
 * /job/updateStatus/{id}:
 *   patch:
 *     summary: Route for user of role agency to update job status
 *     description: Must be logged in as agency.
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
 *         description: ID of the job to update its status.
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
 *               message: The requested job is not existing
 */
jobRouter.patch("/updateStatus/:Id", tokenAuthentication, isAgency, updateJobStatus);

export default jobRouter;
