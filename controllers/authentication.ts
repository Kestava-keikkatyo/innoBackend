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
      const passwordLength: number = body.password ? body.password.length : 0;
      if (passwordLength < 3) {
        return res.status(400).json({ message: "Password length less than 3 characters" });
      }

      if (!["worker", "business", "agency"].includes(body.userType)) {
        return res.status(400).json({ message: "Unknown user type" });
      }

      const saltRounds: number = 10;
      const passwordHash: string = await hash(body.password, saltRounds);
      let user: IUserDocument = new User({
        name: body.name,
        email: body.email,
        userType: body.userType,
        category: body.category,
        passwordHash,
      });
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
          name: user.name,
          email: user.email,
          role: user.userType,
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
      name: user.name,
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
    const user: IUserDocument | null = await User.findById(res.locals.userId);
    if (!user) {
      return res.status(404).json({ message: "User is not existing" });
    }
    const currentPasswordCorrect: boolean = await bcrypt.compare(body.currentPassword, user.passwordHash as string);

    if (!currentPasswordCorrect) {
      return res.status(401).json({ message: "The current password is incorrect" });
    }
    if (body.currentPassword === body.newPassword) {
      return res.status(406).json({
        message: "The new password could not be as same as the current password",
      });
    }
    if (!body.newPassword) {
      return res.status(400).json({ message: "The new password can't be blank" });
    }
    const passwordLength: number = body.newPassword.length;
    if (passwordLength < 3) {
      return res.status(411).json({ message: "password length less than 3 characters" });
    }
    const saltRounds: number = 10;
    let newPasswordHash = await hash(body.newPassword, saltRounds);

    const updatePasswordField = {
      passwordHash: newPasswordHash,
    };
    const updatedUser: IUserDocument | null = await User.findByIdAndUpdate(res.locals.userId, updatePasswordField, {
      new: true,
      omitUndefined: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).send();
  } catch (exception) {
    return next(exception);
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  const token: string = req.headers["x-access-token"] as string;
  if (token) {
    await TokenService.deleteToken(token);
  }
  res.send();
});

export default authRouter;
