import express from "express";
import {
  deleteAgreement,
  postAgreement,
  rejectAgreement,
  signAgreement,
  updateAgreement,
} from "../middleware/agreementMiddleware";
import authenticateToken from "../utils/auhenticateToken";
import { isAgency } from "../utils/authJwt";

const agreementRouter = express.Router();

/**
 * Route for agency to add a new agreement. Agreement object is given in body according to its schema model.
 * @openapi
 * /agreement/:
 *   post:
 *     summary: Route for agency to add a new agreement.
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency]
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
agreementRouter.post("/", authenticateToken, isAgency, postAgreement);

/**
 * Route for agency to sign agreement.
 * @openapi
 * /agreement/sign/{id}:
 *   put:
 *     summary: Route for agency to sign own agreement
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency]
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
agreementRouter.put("/sign/:id", authenticateToken, isAgency, signAgreement);

/**
 * Route for agency to update own agreement.
 * @openapi
 * /agreement/update/{id}:
 *   put:
 *     summary: Route for agency to update own agreement
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency]
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
  authenticateToken,
  isAgency,
  updateAgreement
);

/**
 * Route for agency to reject agreement.
 * @openapi
 * /agreement/reject/{id}:
 *   put:
 *     summary: Route for agency to reject an agreement
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the agreement to be rejected.
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
 *         description: Returns the rejected agreement.
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
  "/reject/:id",
  authenticateToken,
  isAgency,
  rejectAgreement
);

/**
 * Route for agency to delete own agreement
 * @openapi
 * /agreement/delete/{id}:
 *   delete:
 *     summary: Route for agency to delete own agreement
 *     description: Must be logged in as a user of type agency.
 *     tags: [Agreement, Agency]
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
  authenticateToken,
  isAgency,
  deleteAgreement
);

export default agreementRouter;
