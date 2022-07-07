import express from "express";
import { isAdmin } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { getAllResponsibilities, postResponsibility } from "../middleware/responsibilityMiddleware";

const responsibilityRouter = express.Router();

/**
 * Route for admin to add a new responsibility.
 * @openapi
 * /responsibility/:
 *   post:
 *     summary: Route for admin to add a new responsibility.
 *     description: Must be logged in as an admin.
 *     tags: [Responsibility, Admin]
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
 *             $ref: "#/components/schemas/Responsibility"
 *     responses:
 *       "200":
 *         description: Responsibility added. Returns added responsibility object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Responsibility"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
responsibilityRouter.post("/create", tokenAuthentication, isAdmin, postResponsibility);

/**
 * Route for user of role admin to get all responsibilities.
 * @openapi
 * /responsibility/all:
 *   get:
 *     summary: Route for user of role admin to get all responsibilities
 *     description: Need to be logged in as a user.
 *     tags: [Responsibility, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all found responsibilities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Responsibility"
 *       "404":
 *         description: No responsibilities are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No responsibilities found
 */
responsibilityRouter.get("/all", tokenAuthentication, isAdmin, getAllResponsibilities);

export default responsibilityRouter;
