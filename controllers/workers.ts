import { needsToBeAgencyOrBusiness } from "./../utils/middleware";
/** Express router providing Worker-related routes
 * @module controllers/workers
 * @requires express
 */

/**
 * Express router to mount Worker-related functions on.
 * @type {object}
 * @const
 * @namespace workersRouter
 */
import express, { NextFunction, Request, Response } from "express";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { error as _error } from "../utils/logger";
import authenticateToken from "../utils/auhenticateToken";

import Worker from "../models/Worker";
import Agency from "../models/Agency";
import {
  IAgencyDocument,
  IBusinessDocument,
  IWorker,
  IWorkerDocument,
  IAdminDocument,
} from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";
import Business from "../models/Business";
import Admin from "../models/Admin";

const workersRouter = express.Router();

/**
 * @openapi
 * /workers:
 *   post:
 *     summary: Route for registering a new worker account
 *     description: Returns a token that works like the token given when logging in.
 *     tags: [Worker]
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
 *           New worker created.
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
workersRouter.post(
  "/",
  async (
    req: Request<unknown, unknown, IWorker>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { body } = req;

      const business: IBusinessDocument | null = await Business.findOne({
        email: body.email,
      });
      if (business) {
        return res
          .status(409)
          .json({ message: `${body.email} is already registered!` });
      }

      const agency: IAgencyDocument | null = await Agency.findOne({
        email: body.email,
      });
      if (agency) {
        return res
          .status(409)
          .json({ message: `${body.email} is already registered!` });
      }

      const admin: IAdminDocument | null = await Admin.findOne({
        email: body.email,
      });
      if (admin) {
        return res
          .status(409)
          .json({ message: `${body.email} is already registered!` });
      }

      const passwordLength: number = body.password ? body.password.length : 0;
      if (passwordLength < 3) {
        return res
          .status(400)
          .json({ message: "Password length less than 3 characters" });
      }
      const saltRounds: number = 10;
      const passwordHash: string = await hash(body.password, saltRounds);

      const workerToCreate: IWorkerDocument = new Worker({
        name: body.name,
        email: body.email,
        passwordHash,
      });

      return workerToCreate.save(
        (error: CallbackError, worker: IWorkerDocument) => {
          if (error) {
            return res.status(500).json({ message: error.message });
          }
          if (!worker) {
            return res
              .status(500)
              .json({ message: "Unable to save agency document" });
          }

          const workerForToken = {
            email: worker.email,
            id: worker._id,
          };

          const token: string = sign(workerForToken, process.env.SECRET || "");

          return res.status(200).send({
            token,
            name: worker.name,
            email: worker.email,
            role: "worker",
          });
        }
      );
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * @openapi
 * /workers/me:
 *   get:
 *     summary: Route for worker to get their own info
 *     tags: [Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the worker object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Worker"
 *       "401":
 *         description: Incorrect token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Not authorized
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
workersRouter.get(
  "/me",
  authenticateToken,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      //Decodatun tokenin arvo haetaan middlewarelta
      //Tokeni pitää sisällään workerid jolla etsitään oikean käyttäjän tiedot
      Worker.findById(
        res.locals.decoded.id,
        undefined,
        undefined,
        (error: CallbackError, result: IWorkerDocument | null) => {
          if (error) {
            res.status(500).send(error);
          } else if (!result) {
            //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
            res.status(401).send({ message: "Not authorized" });
          } else {
            res.status(200).send(result);
          }
        }
      );
    } catch (exception) {
      next(exception);
    }
  }
);

/**
 * Route used to update worker's information.
 * @openapi
 * /workers:
 *   put:
 *     summary: Route for worker to update their own info. For example password.
 *     tags: [Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     requestBody:
 *       description: |
 *         Any properties that want to be updated are given in request body.
 *         Properties can be any updatable property in the worker object.
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               password: newPass
 *               phonenumber: "4321"
 *     responses:
 *       "200":
 *         description: Worker information updated. Returns updated worker.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Worker"
 *       "400":
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 *       "404":
 *         description: Worker wasn't found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Worker not found
 */
workersRouter.put(
  "/",
  authenticateToken,
  async (
    req: Request<unknown, unknown, IWorker>,
    res: Response,
    next: NextFunction
  ) => {
    const { body } = req;
    let passwordHash: string | undefined;

    try {
      // Salataan uusi salasana
      if (body.password) {
        const passwordLength: number = body.password ? body.password.length : 0;
        if (passwordLength < 3) {
          return res
            .status(400)
            .json({ message: "password length less than 3 characters" });
        }
        const saltRounds: number = 10;
        passwordHash = await hash(body.password, saltRounds);
      }

      // Poistetaan passwordHash bodysta
      // (muuten uusi salasana menee sellaisenaan tietokantaan).
      // Salattu salasana luodaan ylempänä.
      delete body.passwordHash;

      // päivitetään bodyn kentät (mitä pystytään päivittämään).
      // lisätään passwordHash päivitykseen, jos annetaan uusi salasana.
      const updateFields = {
        ...body,
        passwordHash,
      };

      // https://mongoosejs.com/docs/tutorials/findoneandupdate.html
      // https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
      const updatedWorker: IWorkerDocument | null =
        await Worker.findByIdAndUpdate(res.locals.decoded.id, updateFields, {
          new: true,
          omitUndefined: true,
          runValidators: true,
        });

      if (!updatedWorker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      return res.status(200).json(updatedWorker);
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * @openapi
 * /workers/all:
 *   get:
 *     summary: Route for buisnesses and agencies to get all workers
 *     description: Need to be logged in as agency or buisness.
 *     tags: [Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all workers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Worker"
 *       "404":
 *         description: No workers found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Workers not found
 */
workersRouter.get(
  "/all",
  authenticateToken,
  needsToBeAgencyOrBusiness,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workers: Array<IWorkerDocument> | null = await Worker.find(
        {},
        { licenses: 0 }
      ).populate("profile", {}); // TODO use callback for result and errors.
      if (workers) {
        return res.status(200).json(workers);
      }
      return res.status(404).json({ message: "Workers not found" });
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * @openapi
 * /workers:
 *   get:
 *     summary: Route for agency to search for workers by name
 *     description: Need to be logged in as an agency.
 *     tags: [Agency]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: name
 *         description: Worker name we want to search for
 *         required: true
 *         schema:
 *           type: string
 *           example: jarmo
 *     responses:
 *       "200":
 *         description: Returns found workers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Worker"
 *       "404":
 *         description: No workers found with a matching name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Workers not found
 */
workersRouter.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req;

    let name: string | undefined;
    if (query.name) {
      name = query.name as string;
    }

    try {
        /*
      const agency: IAgencyDocument | null = await Agency.findById(
        res.locals.decoded.id
      );
      if (agency && name) {
        // Työntekijät haetaan SQL:n LIKE operaattorin tapaisesti
        // Työpassit jätetään hausta pois
        const workers: Array<IWorkerDocument> = await Worker.find(
          { name: { $regex: name, $options: "i" } },
          { licenses: 0 }
        );
        if (workers) {
          return res.status(200).json(workers);
        }
      } else if (agency && name === undefined) {
        // Työntekijät haetaan SQL:n LIKE operaattorin tapaisesti
        // Työpassit jätetään hausta pois
        const workers: Array<IWorkerDocument> = await Worker.find(
          {},
          { licenses: 0 }
        );
        if (workers) {
          return res.status(200).json(workers);
        }
      }*/

        const workers: Array<IWorkerDocument> = await Worker.find(
            { name: { $regex: name, $options: "i" } },
            { licenses: 0 }
        );
        if (workers) {
            return res.status(200).json(workers);
        }

      return res.status(400).json({ message: "Workers not found" });
    } catch (exception) {
      return next(exception);
    }
  }
);

export default workersRouter;
