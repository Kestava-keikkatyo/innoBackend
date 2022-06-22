import express from "express";
import {
  isAdmin,
  isAgencyOrBusiness,
  isBusiness,
  isUser,
  isWorker,
  isWorkerOrBusinessOrAgency,
} from "../utils/authJwt";
import {
  deleteUser,
  getAllWorkers,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getUserProfile,
  updateUserProfile,
  getUserNotifications,
  postUserFeeling,
  getUserFeelings,
  deleteUserFeeling,
  getAllAgencies,
  getUserByUserType,
  deleteUserNotification,
} from "../middleware/userMiddleware";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";

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
userRouter.post("/create", tokenAuthentication, isAdmin, createUser);

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
userRouter.get("/allUsersForAdmin", tokenAuthentication, isAdmin, getAllUsers);

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
userRouter.get("/any/:id", tokenAuthentication, isUser, getUserById);

/**
 * Route to get user info
 * @openapi
 * /user/me:
 *   get:
 *     summary: Route to get user info
 *     description: Must be logged in as user.
 *     tags: [User, User]
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
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: No user found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: User is not existing
 */
userRouter.get("/me", tokenAuthentication, getUserProfile);

/**
 * Route to get user notifications
 * @openapi
 * /user/notifications:
 *   get:
 *     summary: Route to get user notifications
 *     description: Must be logged in as user.
 *     tags: [User, User]
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
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: No notifications found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No notifications found
 */
userRouter.get("/notifications", tokenAuthentication, getUserNotifications);

/**
 * Route to delete user's notification
 * @openapi
 * /user/delete/notification/{id}:
 *   delete:
 *     summary: Route to delete user's notification.
 *     description: Must be logged in as a user.
 *     tags: [Notification, User]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the notification to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Notification was deleted successfully.
 *       "404":
 *         description: The notification with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Notification is not existing.
 */
userRouter.delete("/delete/notification/:id", tokenAuthentication, deleteUserNotification);

/**
 * Route for user to update own profile.
 * @openapi
 * /user/me:
 *   put:
 *     summary: Route for user to update own profile
 *     description: Must be logged in as user.
 *     tags: [User, User]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the user to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Uer"
 *     responses:
 *       "200":
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: Update failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
userRouter.put("/:userId", tokenAuthentication, updateUserProfile);

userRouter.get("/allWorkersForAdmin", tokenAuthentication, isAdmin, getAllWorkers);

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
userRouter.put("/userUpdate/:userId", tokenAuthentication, isAdmin, updateUser);

/**
 * Route for admin to update user status.
 * @openapi
 * /updateStatus/{userId}:
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
userRouter.patch("/updateStatus/:userId", tokenAuthentication, isAdmin, updateUserStatus);

/**
 * Route for admin to delete user
 * @openapi
 * /user/delete/{userId}:
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
userRouter.delete("/delete/:userId", tokenAuthentication, isAdmin, deleteUser);

/**
 * @openapi
 * /getByUserType/{userType}:
 *   get:
 *     summary: Route for workers, businesses and agencies to get all users by their usertype.
 *     description: Need to be logged in as user of type worker, business or agency.
 *     tags: [Business, Agency, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: userType
 *         description: Usertype we want to fetch. [worker, business, agency, admin]
 *         required: true
 *         schema:
 *           type: string
 *           example: worker
 *     responses:
 *       "200":
 *         description: Returns all users of type worker
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *       "404":
 *         description: No usertype found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:  no workers found
 */
userRouter.get(
  "/getByUserType/:userType/name=:names",
  tokenAuthentication,
  isWorkerOrBusinessOrAgency,
  getUserByUserType
);

/**
 * @openapi
 * /workers:
 *   get:
 *     summary: Route for buisnesses and agencies to get all workers
 *     description: Need to be logged in as user of type buisness or agency.
 *     tags: [Business, Agency, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all users of type worker
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *       "404":
 *         description: No workers found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:  no workers found
 */
userRouter.get("/workers", tokenAuthentication, isAgencyOrBusiness, getAllWorkers);

/**
 * @openapi
 * /workers:
 *   get:
 *     summary: Route for user of role business to get all agencies
 *     description: Need to be logged in as user of type buisness.
 *     tags: [User, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all users of type agency
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *       "404":
 *         description: No agencies found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:  no agencies found
 */
userRouter.get("/agencies", tokenAuthentication, isBusiness, getAllAgencies);

/**
 * Route for user of role worker to post feeling.
 * @openapi
 * /user//feeling/{userId}:
 *   put:
 *     summary: Route for user of role worker to post feeling
 *     description: Must be logged in as user of role worker.
 *     tags: [User, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the user to post feeling.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Uer"
 *     responses:
 *       "200":
 *         description: Feeling posted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: Failed to post feeling.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
userRouter.post("/feeling/", tokenAuthentication, isWorker, postUserFeeling);

/**
 * Route to get user feelings
 * @openapi
 * /user/feelings:
 *   get:
 *     summary: Route to get user feelings
 *     description: Must be logged in as user of role worker.
 *     tags: [User, User]
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
 *               $ref: "#/components/schemas/User"
 *       "404":
 *         description: No feelings found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No feelings found
 */
userRouter.get("/myFeelings", tokenAuthentication, getUserFeelings);

/**
 * Route for user of role worker to delete own feeling
 * @openapi
 * /feeling/myFeelings/{id}:
 *   delete:
 *     summary: Route for user of role worker to delete own feeling
 *     description: Must be logged in as a user of role worker.
 *     tags: [Feeling, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the feeling to be delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: feeling was deleted successfully.
 *       "404":
 *         description: The feeling with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No feeling was found with the requested ID {id}
 */
userRouter.delete("/myFeelings/:feelingId", tokenAuthentication, isWorker, deleteUserFeeling);

export default userRouter;
