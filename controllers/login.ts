import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Worker from "../models/Worker";
import Business from "../models/Business";
import Agency from "../models/Agency";
import {
  IAdminDocument,
  IAgencyDocument,
  IBusinessDocument,
  IWorkerDocument,
} from "../objecttypes/modelTypes";
import { IBodyLogin } from "../objecttypes/otherTypes";
import Admin from "../models/Admin";

const loginRouter = express.Router();

loginRouter.post(
  "/admin",
  async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
    const { body } = req;

    const admin: IAdminDocument | null = await Admin.findOne({
      email: body.email,
    });
    const passwordCorrect: boolean =
      admin === null
        ? false
        : await bcrypt.compare(body.password, admin.passwordHash as string);

    if (!(admin && passwordCorrect)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const adminForToken = {
      email: admin.email,
      id: admin._id,
      role: "admin",
    };
    const token: string = jwt.sign(adminForToken, process.env.SECRET || "");

    return res.status(200).send({
      token,
      name: admin.name,
      email: admin.email,
      role: "admin",
      profileId: admin.profile,
    });
  }
);

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Route for logging in as a worker, business, agency or admin.
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
 *               email: example.email@example.com
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
loginRouter.post(
  "/",
  async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
    const { body } = req;

    let user:
      | IWorkerDocument
      | IBusinessDocument
      | IAgencyDocument
      | IAdminDocument
      | null = await Worker.findOne({ email: body.email });
    if (user == null) user = await Business.findOne({ email: body.email });
    if (user == null) user = await Agency.findOne({ email: body.email });
    if (user == null) user = await Admin.findOne({ email: body.email });
    const passwordCorrect: boolean =
      user === null
        ? false
        : await bcrypt.compare(body.password, user.passwordHash as string);

    if (!(user && passwordCorrect)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.active === true) {
      const workerForToken = {
        email: user.email,
        id: user._id,
        role: user.userType.toLowerCase(),
      };
      const token: string = jwt.sign(workerForToken, process.env.SECRET || "");

      return res.status(200).send({
        token,
        name: user.name,
        email: user.email,
        role: workerForToken.role,
        profileId: user.profile,
      });
    } else {
      return res.status(403).json({
        message: "This account has been blocked for security reasons",
      });
    }
  }
);

export default loginRouter;
