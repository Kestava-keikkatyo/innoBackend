import express from 'express';
import authenticateToken from '../utils/auhenticateToken';
import { needsToBeAgency, needsToBeWorker } from './../utils/middleware';
import {
    postJobVacancyDocument,
    getJobVacancyDocuments,
    getJobVacancyDocumentsForAgency,
    getJobVacancyDocumentById,
    updateJobVacancyDocument,
    deleteJobVacancyDocument
} from '../utils/jobVacanciesMiddleware';


const jobvacanciesRouter = express.Router()


/**
 * Route for agency to add a new job vacancy. Job vacancy object is given in body according to its schema model.
 * @openapi
 * /jobvacancies:
 *   post:
 *     summary: Route for agency to add a new job vacancy.
 *     description: Must be logged in as an agency.
 *     tags: [JobVacancies, Agency]
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
 *             $ref: "#/components/schemas/JobVacancy"
 *     responses:
 *       "200":
 *         description: Job vacancy added. Returns added job vacancy object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/JobVacancy"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobvacanciesRouter.post("/", authenticateToken, needsToBeAgency, postJobVacancyDocument)


/**
 * Route for workers to get all available job vacancies.
 * @openapi
 * /jobvacancies:
 *   get:
 *     summary: Route for workers to get all available job vacancies
 *     description: Need to be logged in as a worker.
 *     tags: [JobVacancies, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns found job vacancies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/JobVacancies"
 *       "404":
 *         description: No job vacancies found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Job vacancies not found
 */
jobvacanciesRouter.get("/", authenticateToken, needsToBeWorker, getJobVacancyDocuments)


/**
* Route for agencies to get their own job vacancies
* @openapi
* /jobvacancies/mine:
*   get:
*     summary: Route for agencies to get their own job vacancies
*     description: Must be logged in as an agency.
*     tags: [JobVacancies, Agency]
*     parameters:
*       - in: header
*         name: x-access-token
*         description: The token you get when logging in is used here. Used to authenticate the user.
*         required: true
*         schema:
*           $ref: "#/components/schemas/AccessToken"
*     responses:
*       "200":
*         description: Returns agency's job vacancies.
*         content:
*           application/json:
*             schema:
*               $ref: "#/components/schemas/JobVacancies"
*       "404":
*         description: Job vacancies not found for the agency in question.
*         content:
*           application/json:
*             schema:
*               $ref: "#/components/schemas/Error"
*             example:
*               message: Could not find job vacancy with ID {id}
*       "500":
*         description: Job vacancies not found.
*         content:
*           application/json:
*             schema:
*               $ref: "#/components/schemas/Error"
*/
jobvacanciesRouter.get("/mine", authenticateToken, needsToBeAgency, getJobVacancyDocumentsForAgency)


/**
* Route for agency to get own job vacancy by its id
* @openapi
* /jobvacancies/mine/{id}:
*   get:
*     summary: Route for agency to get own job vacancy by its id
*     description: Must be logged in as an agency.
*     tags: [JobVacancies, Agency]
*     parameters:
*       - in: header
*         name: x-access-token
*         description: The token you get when logging in is used here. Used to authenticate the user.
*         required: true
*         schema:
*           $ref: "#/components/schemas/AccessToken"
*       - in: path
*         name: id
*         description: ID of the job vacancy which we want.
*         required: true
*         schema:
*           type: string
*           example: 604021e581a9626810885657
*     responses:
*       "200":
*         description: Returns the wanted job vacancy.
*         content:
*           application/json:
*             schema:
*               $ref: "#/components/schemas/JobVacancy"
*       "404":
*         description: No job vacancy was found with the requested ID.
*         content:
*           application/json:
*             schema:
*               $ref: "#/components/schemas/Error"
*             example:
*               message: Could not find job vacancy with ID {id}
*       "500":
*         description: An error occurred when calling the database.
*         content:
*           application/json:
*             schema:
*               $ref: "#/components/schemas/Error"
*/
jobvacanciesRouter.get("/mine/:id", authenticateToken, needsToBeAgency, getJobVacancyDocumentById)


/**
 * Route for agency to update own job vacancy.
 * @openapi
 * /jobvacancies/mine/{id}:
 *   put:
 *     summary: Route for agency to update own job vacancy
 *     description: Must be logged in as an agency.
 *     tags: [JobVacancies, Agency]
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
 *             $ref: "#/components/schemas/JobVacancy"
 *     responses:
 *       "200":
 *         description: Returns the updated job vacancy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/JobVacancy"
 *       "403":
 *         description: Can't update job vacancies that you didn't create
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: You are not authorized to update this job vacancy
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
*/
jobvacanciesRouter.put("/mine/:id", authenticateToken, needsToBeAgency, updateJobVacancyDocument)


/**
 * Route for agency to delete own job vacancy
 * @openapi
 * /jobvacancies/mine/{id}:
 *   delete:
 *     summary: Route for agency to delete own job vacancy
 *     description: Must be logged in as an agency.
 *     tags: [JobVacancies, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the job vacancy which we want to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "204":
 *         description: Job vacancy deleted successfully.
 *       "403":
 *         description: Can't delete job vacancies that you didn't create.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: You are not authorized to delete this job vacancy
 *       "404":
 *         description: No job vacancy was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Could not find job vacancy with ID {id}
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
jobvacanciesRouter.delete("/mine/:id", authenticateToken, needsToBeAgency, deleteJobVacancyDocument)


export default jobvacanciesRouter
