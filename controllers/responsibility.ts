import express from "express";
import { isAdmin, isWorkerOrBusinessOrAgency } from "../utils/authJwt";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import {
  getMyResponsibilities,
  deleteResponsibility,
  getAllResponsibilities,
  getResponsibilityById,
  postResponsibility,
  updateResponsibility,
} from "../middleware/responsibilityMiddleware";

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
 *     description: Need to be logged in as a user of role admin.
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

/**
 * Route for user of role worker,business or agency to get their responsibilities.
 * @openapi
 * /responsibility/my:
 *   get:
 *     summary: Route for user of role worker, business or agency to get their responsibilities.
 *     description: Need to be logged in as a user of role worker, business or agency.
 *     tags: [Responsibility, Worker, Business, Agency]
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
responsibilityRouter.get("/my", tokenAuthentication, isWorkerOrBusinessOrAgency, getMyResponsibilities);

/**
 * Route for admin to get a responsibility by its id
 * @openapi
 * /responsibility/any/{id}:
 *   get:
 *     summary: Route for admin to get a responsibility by its id
 *     description: Must be logged in as admin.
 *     tags: [Responsibility, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested responsibility.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested responsibility.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Responsibility"
 *       "404":
 *         description: No responsibility was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:The frequested responsibility is not existing
 */
responsibilityRouter.get("/any/:id", tokenAuthentication, isAdmin, getResponsibilityById);

/**
 * Route for admin to update a responsibility.
 * @openapi
 * /responsibility/update/{id}:
 *   put:
 *     summary: Route for admin to update a responsibility.
 *     description: Must be logged in as an admin.
 *     tags: [Responsibility, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the responsibility to be updated.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Responsibility"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Responsibility"
 *       "404":
 *         description: A responsibility with the specified ID was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
responsibilityRouter.put("/update/:id", tokenAuthentication, isAdmin, updateResponsibility);

/**
 * Route for admin to delete a responsibility
 * @openapi
 * /responsibility/delete/{id}:
 *   delete:
 *     summary: Route for admin to delete a responsibility.
 *     description: Must be logged in as an admin.
 *     tags: [Responsibility, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the responsibility to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Responsibility was deleted successfully.
 *       "404":
 *         description: The responsibility with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: responsibility is not existing.
 */
responsibilityRouter.delete("/delete/:id", tokenAuthentication, isAdmin, deleteResponsibility);

export default responsibilityRouter;
