import express from "express";
import { checkDuplicateEmail } from "../utils/verifySignUp";
import { changePassword, logout, register, signIn, tokenAuthentication } from "../middleware/authenticationMiddleware";

const authRouter = express.Router();

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Route for registering a new user account
 *     description: Returns a token that works like the token given when logging in.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - user type
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               name: John Doe
 *               email: example.email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           New user created.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "400":
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 *       "409":
 *         description: Email is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Email is already registered
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
authRouter.post("/register", checkDuplicateEmail, register);

/**
 * @openapi
 * /signin:
 *   post:
 *     summary: Route for logging user in as a worker, business, agency or admin.
 *     description: Response provides a token used for authentication in most other calls.
 *     tags: [Worker, Agency, Business, Admin, Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: email@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: |
 *           Logged in as worker, business, agency or admin.
 *           For authentication, token needs to be put in a header called "x-access-token" in most other calls.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginOrRegister"
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Invalid email or password
 *       "403":
 *         description: This account has been blocked for security reasons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
authRouter.post("/signin", signIn);

/**
 * @openapi
 * /users/changePassword:
 *   put:
 *     summary: Route for users to change their own password.
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     requestBody:
 *       description: |
 *         Properties are the current password and the new password of the user object.
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               currentPassword: currentPass123
 *               newPassword: newPass123
 *     responses:
 *       "200":
 *         description: User password updated. Returns updated user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Worker"
 *       "401":
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Current password is incorrect
 *       "400":
 *         description: The new password can't be blank
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: The new password can't be blank
 *       "406":
 *         description: The new password could not be as same as current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: The new password could not be as same as current password
 *       "411":
 *         description: Incorrect password "Length required"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 *       "404":
 *         description: User wasn't found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: User not found
 */
authRouter.put("/changePassword", tokenAuthentication, changePassword);

authRouter.post("/logout", logout);

export default authRouter;
