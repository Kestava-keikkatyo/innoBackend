import express from "express";
import {
  isAdmin,
  isAgencyOrBusiness,
  isUser,
  isWorker,
  isWorkerOrBusinessOrAgency,
} from "../utils/authJwt";
import {
  archiveReport,
  getAllReports,
  getMyReports,
  getReportById,
  getReportsForReceiver,
  postReport,
  replyReport,
} from "../middleware/reportMiddleware";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
const reportRouter = express.Router();

/**
 * Route for worker to send a report. Report object is given in body according to its schema model.
 * @openapi
 * /report/:
 *   post:
 *     summary: Route for worker to send a report.
 *     description: Must be logged in a user of type worker.
 *     tags: [Report, Worker]
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
 *             $ref: "#/components/schemas/Report"
 *     responses:
 *       "200":
 *         description: Report was sent. Returns sent report object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
reportRouter.post("/", tokenAuthentication, isWorker, postReport);

/**
 * Route for user of type worker to get own reports
 * @openapi
 * /report/myReports:
 *   get:
 *     summary: Route for user of type worker to get own reports
 *     description: Must be logged in as user of type worker.
 *     tags: [Report, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns worker's reports.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Report"
 *       "404":
 *         description: The requested reports are not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No reports found
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
reportRouter.get("/myReports", tokenAuthentication, isWorker, getMyReports);

/**
 * Route for user to report by its id
 * @openapi
 * /report/status/{id}:
 *   get:
 *     summary: Route for user to get report by its id
 *     description: Must be logged in as user.
 *     tags: [Report, User]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested report.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested report.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       "404":
 *         description: No report was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No report found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
reportRouter.get("/status/:id", tokenAuthentication, isUser, getReportById);

/**
 * Route for user of type admin to get all reports.
 * @openapi
 * /report/allReports:
 *   get:
 *     summary: Route for user of type admin to get all reports
 *     description: Need to be logged in as a admin.
 *     tags: [Report, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Report"
 *       "404":
 *         description: No reports are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No reports found
 */
reportRouter.get("/allReports", tokenAuthentication, isAdmin, getAllReports);

/**
 * Route for user of type agency or business to reply a report.
 * @openapi
 * /report/reply/{id}:
 *   put:
 *     summary: Route for user of type agency or business to reply a report
 *     description: Must be logged in as a user of type agency or business.
 *     tags: [report, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the report to be replied.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Report"
 *     responses:
 *       "200":
 *         description: Returns the replied report.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       "404":
 *         description: No report was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No report found
 */
reportRouter.put(
  "/reply/:id",
  tokenAuthentication,
  isAgencyOrBusiness,
  replyReport
);

/**
 * Route for user of type agency or business to archive a report.
 * @openapi
 * /report/archive/{id}/{archived}:
 *   put:
 *     summary: Route for user of type agency or business to archive a report
 *     description: Must be logged in as a user of type agency or business or worker.
 *     tags: [report, Agency, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the report to be replied.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *       - in: path
 *         name: archived
 *         description: Value of archive status.
 *         required: true
 *         schema:
 *           type: boolean
 *           example: false
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Report"
 *     responses:
 *       "200":
 *         description: Returns the replied report.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       "404":
 *         description: No report was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No report found
 */
reportRouter.put(
  "/archive/:id/:archived",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  archiveReport
);

/**
 * Route for user of type agency or business to get all the sent reports.
 * @openapi
 * /report/receivedReports:
 *   get:
 *     summary: Route for user of type agency or business to get all the sent reports
 *     description: Need to be logged in as a user of type agency or business.
 *     tags: [Report, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Report"
 *       "404":
 *         description: No reports are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No reports found
 */
reportRouter.get(
  "/receivedReports",
  tokenAuthentication,
  isAgencyOrBusiness,
  getReportsForReceiver
);

export default reportRouter;
