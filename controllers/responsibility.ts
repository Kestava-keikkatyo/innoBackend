import express from "express";
import { isAdmin } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { postResponsibility } from "../middleware/responsibilityMiddleware";

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

export default responsibilityRouter;
