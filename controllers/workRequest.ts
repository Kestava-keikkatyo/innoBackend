import express from "express";
import { isBusiness } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { postWorkRequest } from "../middleware/workRequestMiddleware";

const workRequestRouter = express.Router();

/**
 * Route for business to send a work request.
 * @openapi
 * /workRequest/:
 *   post:
 *     summary: Route for business to send a work request.
 *     description: Must be logged in as a user of type business.
 *     tags: [Workrequest, Business]
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
 *             $ref: "#/components/schemas/"
 *     responses:
 *       "200":
 *         description: Work request was sent. Returns sent work request object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkRequest"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
workRequestRouter.post("/", tokenAuthentication, isBusiness, postWorkRequest);

export default workRequestRouter;
