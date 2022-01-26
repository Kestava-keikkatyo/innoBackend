import express from "express";
import authenticateToken from "../utils/auhenticateToken";
import { isAdmin } from "../utils/authJwt";
import {
  deleteUser,
  getAllWorkers,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
} from "../middleware/userMiddleware";

const userRouter = express.Router();

/**
 * Route for admin to add a new user. User object is given in body according to its schema model.
 * @openapi
 * /user/:
 *   post:
 *     summary: Route for admin to add a new user.
 *     description: Must be logged in as an admin.
 *     tags: [User, Admin]
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
 *             $ref: "#/components/schemas/User"
 *     responses:
 *       "200":
 *         description: User added. Returns added user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
userRouter.post("/", authenticateToken, isAdmin, createUser);

/**
 * Route for admin to get all users.
 * @openapi
 * /user/getUserDocuments:
 *   get:
 *     summary: Route for admin to get all users
 *     description: Need to be logged in as a admin.
 *     tags: [Users, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all found users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *       "404":
 *         description: No users are existing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No users found
 */
userRouter.get("/allUsersForAdmin", authenticateToken, isAdmin, getAllUsers);

/**
 * Route for admin to get user by id
 * @openapi
 * /user/userForAdmin/{id}:
 *   get:
 *     summary: Route for admin to get user by id
 *     description: Must be logged in as user.
 *     tags: [User, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested user.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/user"
 *       "404":
 *         description: No user was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No user with ID {id} found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
userRouter.get("/userForAdmin/:id", authenticateToken, isAdmin, getUserById);

userRouter.get(
  "/allWorkersForAdmin",
  authenticateToken,
  isAdmin,
  getAllWorkers
);

/**
 * Route for admin to update user.
 * @openapi
 * /updateUser/{userId}:
 *   put:
 *     summary: Route for admin to update user
 *     description: Must be logged in as admin.
 *     tags: [User, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the user which admin wants to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/User"
 *     responses:
 *       "200":
 *         description: Returns the updated user Id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: No user was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: User with ID {userId} is not existing
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
userRouter.put("/userUpdate/:userId", authenticateToken, isAdmin, updateUser);

/**
 * Route for admin to update user status.
 * @openapi
 * /updateUserStatus/{userId}:
 *   patch:
 *     summary: Route for admin to update user status
 *     description: Must be logged in as admin.
 *     tags: [User, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the user which admin wants to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/User"
 *     responses:
 *       "200":
 *         description: Returns the updated user Id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: No user was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: User with ID {userId} is not existing
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
userRouter.patch(
  "/userUpdate/:userId",
  authenticateToken,
  isAdmin,
  updateUserStatus
);

/**
 * Route for admin to delete user
 * @openapi
 * /job/userDelete/{userId}:
 *   delete:
 *     summary: Route for admin to delete
 *     description: Must be logged in as an admin.
 *     tags: [User, Admin]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the user which we want to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: User was deleted successfully.
 *       "404":
 *         description: The user with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No user was found with the requested ID {userId}
 */
userRouter.delete(
  "/userDelete/:userId",
  authenticateToken,
  isAdmin,
  deleteUser
);

export default userRouter;
