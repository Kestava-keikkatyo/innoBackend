/** Express router providing Business-related routes
 * @module controllers/businesses
 * @requires express
 */

/**
 * Express router to mount Business-related functions on.
 * @type {object}
 * @const
 * @namespace businessesRouter
 */
import express, { NextFunction, Request, Response } from "express";
import { hash } from "bcryptjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { error as _error } from "../utils/logger";
import Business from "../models/Business";
import authenticateToken from "../utils/auhenticateToken";
import {
  IAgencyDocument,
  IBusiness,
  IBusinessDocument,
  IWorkerDocument,
  IAdminDocument,
} from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";
import { needsToBeAgencyOrWorker } from "../utils/middleware";
import Agency from "../models/Agency";
import Worker from "../models/Worker";
import Admin from "../models/Admin";

const businessesRouter = express.Router();
/**
 * @openapi
 * /businesses:
 *   post:
 *     summary: Route for registering a new business account
 *     description: Returns a token that works like the token given when logging in.
 *     tags: [Business]
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
 *           New business created.
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
businessesRouter.post(
  "/",
  async (
    req: Request<unknown, unknown, IBusiness>,
    res: Response,
    next: NextFunction
  ) => {
    const { body } = req;

    const agency: IAgencyDocument | null = await Agency.findOne({
      email: body.email,
    });
    if (agency) {
      return res
        .status(409)
        .json({ message: `${body.email} is already registered!` });
    }

    const worker: IWorkerDocument | null = await Worker.findOne({
      email: body.email,
    });
    if (worker) {
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

    try {
      // TODO This could be separated into a validation middleware
      const passwordLength: number = body.password ? body.password.length : 0;
      if (passwordLength < 3) {
        return res
          .status(400)
          .json({ message: "password length less than 3 characters" });
      }
      const saltRounds: number = 10;
      const passwordHash: string = await bcrypt.hash(body.password, saltRounds);

      const businessToCreate: IBusinessDocument = new Business({
        name: body.name,
        email: body.email,
        category: body.category,
        passwordHash,
      });

      return businessToCreate.save(
        (error: CallbackError, business: IBusinessDocument) => {
          if (error) {
            return res.status(500).json({ message: error.message });
          }
          if (!business) {
            return res
              .status(500)
              .json({ message: "Unable to save business document" });
          }

          const businessForToken = {
            email: business.email,
            id: business._id,
          };

          const token: string = jwt.sign(
            businessForToken,
            process.env.SECRET || ""
          );

          return res.status(200).send({
            token,
            name: business.name,
            email: business.email,
            role: "business",
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
 * /businesses/me:
 *   get:
 *     summary: Route for business to get their own info
 *     tags: [Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the business object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Business"
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
businessesRouter.get(
  "/me",
  authenticateToken,
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      //Decodatun tokenin arvo haetaan middlewarelta
      //Tokeni pitää sisällään userid jolla etsitään oikean käyttäjän tiedot
      Business.findById(
        res.locals.decoded.id,
        undefined,
        undefined,
        (error: CallbackError, result: IBusinessDocument | null) => {
          if (error) {
            return res.status(500).send(error);
          } else if (!result) {
            //Jos ei resultia niin käyttäjän tokenilla ei löydy käyttäjää
            return res.status(401).send({ message: "Not authorized" });
          } else {
            return res.status(200).send(result);
          }
        }
      );
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * Route used to update business's information.
 * @openapi
 * /businesses:
 *   put:
 *     summary: Route for business to update their own info. For example password.
 *     tags: [Business]
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
 *         Properties can be any updatable property in the business object.
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               password: newPass
 *               phonenumber: "4321"
 *     responses:
 *       "200":
 *         description: Business information updated. Returns updated business.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Business"
 *       "400":
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 *       "404":
 *         description: Business wasn't found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Business not found
 */
businessesRouter.put(
  "/",
  authenticateToken,
  async (
    req: Request<unknown, unknown, IBusiness>,
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
            .json({ message: "Password length less than 3 characters" });
        }
        const saltRounds: number = 10;
        passwordHash = await bcrypt.hash(body.password, saltRounds);
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
      const updatedBusiness: IBusinessDocument | null =
        await Business.findByIdAndUpdate(
          res.locals.decoded.id,
          updateFields, // TODO use callback for error handling
          { new: true, omitUndefined: true, runValidators: true }
        );

      if (!updatedBusiness) {
        return res.status(404).json({ message: "Business not found" });
      }
      return res.status(200).json(updatedBusiness);
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * @openapi
 * /businesses/all:
 *   get:
 *     summary: Route for agencies and workers to get all businesses
 *     description: Need to be logged in as an agency or worker.
 *     tags: [Agency, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns all businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Business"
 *       "404":
 *         description: No businesses found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Businesses not found
 */
businessesRouter.get(
  "/all",
  authenticateToken,
  needsToBeAgencyOrWorker,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const businesses: Array<IBusinessDocument> | null = await Business.find(
        {},
        {
          name: 1,
          email: 1,
          businessContracts: 1,
          profile: 1,
          userType: 1,
          active: 1,
        }
      ).populate("profile", {}); // TODO use callback for result and errors.
      if (businesses) {
        return res.status(200).json(businesses);
      }
      return res.status(404).json({ message: "Businesses not found" });
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * @openapi
 * /businesses:
 *   get:
 *     summary: Route for agencies and workers to search for businesses by name
 *     description: Need to be logged in as an agency or worker.
 *     tags: [Agency, Worker]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: name
 *         description: Business name we want to search for
 *         required: true
 *         schema:
 *           type: string
 *           example: jarmo
 *     responses:
 *       "200":
 *         description: Returns found businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Business"
 *       "404":
 *         description: No businesses found with a matching name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Businesses not found
 */
businessesRouter.get(
  "/",
  authenticateToken,
  needsToBeAgencyOrWorker,
  async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req;

    let name: string | undefined;
    if (query.name) {
      name = query.name as string;
    }
    try {
      if (name) {
        const businesses: Array<IBusinessDocument> = await Business.find(
          { name: { $regex: name, $options: "i" } },
          { licenses: 0 }
        ); // TODO use callback for result and errors.
        if (businesses) {
          return res.status(200).json(businesses);
        }
      } else if (!name || name === undefined) {
        const businesses: Array<IBusinessDocument> = await Business.find(
          {},
          { licenses: 0 }
        ); // TODO use callback for result and errors.
        if (businesses) {
          return res.status(200).json(businesses);
        }
      }
      return res.status(404).json({ message: "Businesses not found" });
    } catch (exception) {
      return next(exception);
    }
  }
);

/**
 * Route used to update business's information.
 * @openapi
 * /businesses:
 *   put:
 *     summary: Route for business to update their own info. For example password.
 *     tags: [Business]
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
 *         Properties can be any updatable property in the business object.
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               password: newPass
 *               phonenumber: "4321"
 *     responses:
 *       "200":
 *         description: Business information updated. Returns updated business.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Business"
 *       "400":
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Password length less than 3 characters
 *       "404":
 *         description: Business wasn't found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Business not found
 */
businessesRouter.put(
  "/",
  authenticateToken,
  async (
    req: Request<unknown, unknown, IBusiness>,
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
            .json({ message: "Password length less than 3 characters" });
        }
        const saltRounds: number = 10;
        passwordHash = await bcrypt.hash(body.password, saltRounds);
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
      const updatedBusiness: IBusinessDocument | null =
        await Business.findByIdAndUpdate(
          res.locals.decoded.id,
          updateFields, // TODO use callback for error handling
          { new: true, omitUndefined: true, runValidators: true }
        );

      if (!updatedBusiness) {
        return res.status(404).json({ message: "Business not found" });
      }
      return res.status(200).json(updatedBusiness);
    } catch (exception) {
      return next(exception);
    }
  }
);

export default businessesRouter;
