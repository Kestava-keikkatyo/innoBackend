import express, { NextFunction, Request, Response } from "express";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { error as _error } from "../utils/logger";
import User from "../models/User";
import { IUserDocument, IUser } from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";
import { checkDuplicateEmail } from "../utils/verifySignUp";
import { IBodyLogin } from "../objecttypes/otherTypes";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authenticateToken from "../utils/auhenticateToken";

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
  async (
    req: Request<unknown, unknown, IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const { body } = req;

    try {
      const passwordLength: number = body.password ? body.password.length : 0;
      if (passwordLength < 3) {
        return res
          .status(400)
          .json({ message: "Password length less than 3 characters" });
      }
      const saltRounds: number = 10;
      const passwordHash: string = await hash(body.password, saltRounds);

      let user: IUserDocument = new User({
        name: body.name,
        email: body.email,
        userType: body.userType,
        passwordHash,
      });
      return user.save((error: CallbackError, user: IUserDocument) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!user) {
          return res
            .status(500)
            .json({ message: "Unable to save user document" });
        }
        const userForToken = {
          email: user.email,
          id: user._id,
        };
        const token: string = sign(userForToken, process.env.SECRET || "");
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

export default authRouter;
