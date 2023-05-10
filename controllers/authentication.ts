import express, { NextFunction, Request, Response } from "express";
import { hash } from "bcryptjs";
import User from "../models/User";
import { IUserDocument, IUser } from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";
import { checkDuplicateEmail } from "../utils/verifySignUp";
import { IBodyLogin } from "../objecttypes/otherTypes";
import bcrypt from "bcryptjs";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import TokenService from "../services/TokenService";
import { CloudWatchLogs } from "aws-sdk";

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
authRouter.post(
  "/register",
  checkDuplicateEmail,
  async (req: Request<unknown, unknown, IUser>, res: Response, next: NextFunction) => {
    const { body } = req;

    try {
      const passwordLength = body.password ? body.password.length : 0;
      if (passwordLength < 8) {
        return res.status(400).json({ message: "Password length less than 8 characters" });
      }

      if (!["worker", "business", "agency"].includes(body.userType)) {
        return res.status(400).json({ message: "Unknown user type" });
      }

      const saltRounds: number = 10;
      const passwordHash: string = await hash(body.password, saltRounds);
      let user: IUserDocument = new User({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        userType: body.userType,
        category: body.category,
        passwordHash,
      });
      const validationError = user.validateSync();
      if (validationError) {
        return res.status(400).json({ message: validationError.message });
      }
      return user.save(async (error: CallbackError, user: IUserDocument) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!user) {
          return res.status(500).json({ message: "Unable to save user document" });
        }
        const token: string = await TokenService.createToken(user);
        return res.status(200).send({
          token,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.userType.toLowerCase(),
          _id: user.id,
        });
      });
    } catch (exception) {
      return next(exception);
    }
  }
);

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
authRouter.post("/signin", async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req;

  const user: IUserDocument | null = await User.findOne({
    email: body.email,
  });
  const passwordCorrect: boolean =
    user === null ? false : await bcrypt.compare(body.password, user.passwordHash as string);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.active) {
    const token: string = await TokenService.createToken(user);

    return res.status(200).send({
      token,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.userType.toLowerCase(),
      _id: user.id,
    });
  } else {
    return res.status(403).json({
      message: "This account has been blocked for security reasons",
    });
  }
});

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
authRouter.put("/changePassword", tokenAuthentication, async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const user: IUserDocument = (await User.findById(res.locals.userId)) as IUserDocument;

    const currentPasswordCorrect: boolean = await bcrypt.compare(body.currentPassword, user.passwordHash as string);

    if (!currentPasswordCorrect) {
      return res.status(406).json({ message: "The current password is incorrect" });
    }
    if (body.currentPassword === body.newPassword) {
      return res.status(406).json({
        message: "The new password can not be as same as the current password",
      });
    }
    if (!body.newPassword) {
      return res.status(400).json({ message: "The new password can't be blank" });
    }
    const passwordLength: number = body.newPassword.length;
    if (passwordLength < 8) {
      return res.status(411).json({ message: "password length less than 8 characters" });
    }
    const saltRounds: number = 10;
    let newPasswordHash = await hash(body.newPassword, saltRounds);

    const updatePasswordField = {
      passwordHash: newPasswordHash,
    };
    await user.update(updatePasswordField);
    await user.save();

    return res.status(200).send();
  } catch (exception) {
    return next(exception);
  }
});

/**
 * This function should send out an email to the received email address.
 * Instead of sending the 'resetLink' variable as a response, it should be send to the user supplied email using e.g. Nodemailer.
 * Check the following links:
 * https://nodemailer.com/about/
 * https://mailtrap.io/blog/send-emails-with-nodejs/
 */
authRouter.post("/forgottenpassword", async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const user: IUserDocument | null = await User.findOne({
      email: body.email,
    });
    if (user === null) {
      return res.status(401).json({ message: "Email does not exist." });
    } else if (user.active) {

      // Commented lines are for testing in local environment.
      // Server sends the password reset link as a response and following that link, password can be reset.

      // const token: string = await TokenService.createToken(user);
      // const resetLink = `http://localhost:3000/forgotpassword?token=${token}`;
      // return res.status(200).json({ message: "Click this link to create a new password: ", resetLink });

      return res.status(200).json({ message: "Email received." });
    }
  } catch (exception) {
    return next(exception);
  }
});

authRouter.put("/resetPassword", tokenAuthentication, async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const user: IUserDocument = (await User.findById(res.locals.userId)) as IUserDocument;

    if (!body.newPassword) {
      return res.status(400).json({ message: "The new password can't be blank" });
    }
    const passwordLength: number = body.newPassword.length;
    if (passwordLength < 8) {
      return res.status(411).json({ message: "password length less than 8 characters" });
    }
    const saltRounds: number = 10;
    let newPasswordHash = await hash(body.newPassword, saltRounds);

    const updatePasswordField = {
      passwordHash: newPasswordHash,
    };
    await user.update(updatePasswordField);
    await user.save();

    return res.status(200).send();
  } catch (exception) {
    return next(exception);
  }
});

/**
 * Checks the database for the token that the user is using inside the password reset address.
 * If token is not found, send error response and handle user redirect to error page in client side.
 */
authRouter.post("/verifytoken", async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  const token: string = body.token as string;
  try {
    const user = await TokenService.verify(token);
    if (user === null) {
      return res.status(401).json({ message: "Failed to authenticate token." });
    } else if (user) {
      return res.status(200).send();
    }
  } catch (exception) {
    return next(exception);
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  const token: string = req.headers["x-access-token"] as string;
  if (token) {
    await TokenService.deleteToken(token);
  }
  return res.status(200).send();
});

export default authRouter;
