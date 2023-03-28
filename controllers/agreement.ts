import express from "express";
import {
  deleteAgreement,
  getMyAgreements,
  postAgreement,
  signAgreement,
  updateAgreement,
  getTargetAgreements,
  getMySignedAgreements,
  getSignedTargetAgreements,
  postEmploymentAgreement,
  getEmploymentAgreements,
  rejectEmploymentAgreement,
  deleteEmploymentAgreement,
  signEmploymentAgreement,
} from "../middleware/agreementMiddleware";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import {
  isAgency,
  isAgencyOrBusiness,
  isWorkerOrBusiness,
  isWorkerOrBusinessOrAgency,
} from "../utils/authJwt";

const agreementRouter = express.Router();

/**
 * Route for agency, worker and business to get their agreements.
 * @openapi
 * /agreement/:
 *   get:
 *     summary: Route for agency, worker and business to get their agreements.
 *     description: Must be logged in as a user of type agency, worker or business.
 *     tags: [Agreement, Agency, Worker, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Agreement added. Returns added agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.get(
  "/",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  getMyAgreements
);

/**
 * Route for agency to get their signed agreements.
 * @openapi
 * /agreement/signed/creator:
 *   get:
 *     summary: Route for agency to get their signed agreements where they are the creator.
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Agreement added. Returns added agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.get(
  "/signed/creator",
  tokenAuthentication,
  isAgency,
  getMySignedAgreements
);

/**
 * Route for worker and business to get their signed agreements.
 * @openapi
 * /agreement/signed/target:
 *   get:
 *     summary: Route for business and worker to get their signed agreements where they are the target.
 *     description: Must be logged in as a user of type business or worker.
 *     tags: [Agreement, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Agreement added. Returns added agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.get(
  "/signed/target",
  tokenAuthentication,
  isWorkerOrBusiness,
  getSignedTargetAgreements
);

/**
 * Route for worker and business to get their signed employment agreements.
 * @openapi
 * /agreement/signed/employment:
 *   get:
 *     summary: Route for business to get their signed agreements where they are the target.
 *     description: Must be logged in as a user of type agency, business or worker.
 *     tags: [Agreement, Agency, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Agreement added. Returns added agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EmploymentAgreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.get(
  "/employment/signed",
  tokenAuthentication,
  isWorkerOrBusiness,
  getMySignedAgreements
);


/**
 * Route for agency and business to get their agreements.
 * @openapi
 * /agreement/target:
 *   get:
 *     summary: Route for agency, business and worker to get their agreements where they are the target.
 *     description: Must be logged in as a user of type agency, business or worker.
 *     tags: [Agreement, Agency, Business, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Agreement added. Returns added agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.get(
  "/target",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  getTargetAgreements
);

/**
 * Route for agency and business to add a new agreement. Agreement object is given in body according to its schema model.
 * @openapi
 * /agreement/:
 *   post:
 *     summary: Route for agency and business to add a new agreement.
 *     description: Must be logged in as a user of type agency or business.
 *     tags: [Agreement, Agency, Business]
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
 *             $ref: "#/components/schemas/Agreement"
 *     responses:
 *       "200":
 *         description: Agreement added. Returns added agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.post(
  "/",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  postAgreement
);

/**
 * Route for agency to add a new employment agreement.
 * @openapi
 * /agreement/employment:
 *   post:
 *     summary: Route for agency to add a new employment agreement.
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency, Business, Worker]
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
 *             $ref: "#/components/schemas/EmploymentAgreement"
 *     responses:
 *       "200":
 *         description: Employment agreement added. Returns added employment agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EmploymentAgreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.post(
  "/employment",
  tokenAuthentication,
  isAgency,
  postEmploymentAgreement
);

/**
 * Route for Worker and Business to fetch all their employment agreements
 * @openapi
 * /agreement/employment:
 *   post:
 *     summary: Route for worker to fetch all his employment agreements.
 *     description: Must be logged in as a user of type worker or business.
 *     tags: [Agreement, Business, Worker]
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
 *             $ref: "#/components/schemas/EmploymentAgreement"
 *     responses:
 *       "200":
 *         description: Employment agreement added. Returns added employment agreement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EmploymentAgreement"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
agreementRouter.get(
  "/employment",
  tokenAuthentication,
  isWorkerOrBusiness,
  getEmploymentAgreements
);


/**
 * Route for agency and business to sign or reject agreement.
 * @openapi
 * /agreement/sign/{id}/{status}:
 *   put:
 *     summary: Route for agency and business to sign own agreement
 *     description: Must be logged in as a user of type agency or business.
 *     tags: [Agreement, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the agreement to be signed.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *       - in: path
 *         name: status
 *         description: Agreements new status.
 *         required: true
 *         schema:
 *           type: string
 *           example: signed, rejected, terminated...
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Agreement"
 *     responses:
 *       "200":
 *         description: Returns the signed agreement.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "404":
 *         description: No agreement was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No agreement found!
 */
agreementRouter.put(
  "/sign/:id/:status",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  signAgreement
);

/**
 * Route for worker and business to sign employment agreement.
 * @openapi
 * /agreement/employment/sign/{id}/:
 *   put:
 *     summary: Route for worker and business to sign employment agreement
 *     description: Must be logged in as a user of type worker or business.
 *     tags: [Agreement, Worker, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the employment agreement to be signed.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/EmploymentAgreement"
 *     responses:
 *       "200":
 *         description: Returns the signed agreement.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EmploymentAgreement"
 *       "404":
 *         description: No agreement was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No agreement found!
 */
agreementRouter.put(
  "/employment/sign/:id",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  signEmploymentAgreement
);

/**
 * Route for worker and business to refuse employment agreement.
 * @openapi
 * /agreement/employment/refuse/{id}/:
 *   put:
 *     summary: Route for worker and business to refuse employment agreement
 *     description: Must be logged in as a user of type worker or business.
 *     tags: [Agreement, Worker, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the employment agreement to be signed.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/EmploymentAgreement"
 *     responses:
 *       "200":
 *         description: Returns the signed agreement.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EmploymentAgreement"
 *       "404":
 *         description: No agreement was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No agreement found!
 */
agreementRouter.put(
  "/employment/refuse/:id",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  rejectEmploymentAgreement
);

/**
 * Route for agency and business to update own agreement.
 * @openapi
 * /agreement/update/{id}:
 *   put:
 *     summary: Route for agency and business to update own agreement
 *     description: Must be logged in as a user of type agency or business.
 *     tags: [Agreement, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the agreement to be updated.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Agreement"
 *     responses:
 *       "200":
 *         description: Returns the updated agreement.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Agreement"
 *       "404":
 *         description: No agreement was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No agreement found!
 */
agreementRouter.put(
  "/update/:id",
  tokenAuthentication,
  isAgencyOrBusiness,
  updateAgreement
);

/**
 * Route for agency, worker and business to delete own agreement
 * @openapi
 * /agreement/delete/{id}:
 *   delete:
 *     summary: Route for agency and business to delete own agreement
 *     description: Must be logged in as a user of type agency, worker or business.
 *     tags: [Agreement, Agency, Worker, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the agreement to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Agreement was deleted successfully.
 *       "404":
 *         description: The agreement with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No agreement was found with the requested ID
 */
agreementRouter.delete(
  "/delete/:id",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  deleteAgreement
);

/**
 * Route for agency, worker and business to delete own employment agreement
 * @openapi
 * /agreement/employment/delete/{id}:
 *   delete:
 *     summary: Route for agency, worker and business to delete own employment agreement
 *     description: Must be logged in as a user of type agency, worker or business.
 *     tags: [Agreement, Agency, Worker, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the agreement to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Agreement was deleted successfully.
 *       "404":
 *         description: The agreement with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No agreement was found with the requested ID
 */
agreementRouter.delete(
  "/employment/delete/:id",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  deleteEmploymentAgreement
);

export default agreementRouter;
