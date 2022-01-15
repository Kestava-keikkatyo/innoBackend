import { NextFunction, Request, Response } from "express";
import { error as _error, info } from "./logger";
import User from "../models/User";

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  info("Method:", req.method);
  info("Path:  ", req.path);
  info("Body:  ", req.body);
  info("---");
  next();
};

export const unknownEndpoint = (_req: Request, res: Response) => {
  res.status(404).send({ error: "unknown endpoint" });
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): any => {
  _error(err.message);

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).send({ error: "malformatted id" });
  } else if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
};

const doesUserExist = async (
  userTypes: string[] | undefined,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    let filters: any = {
      _id: res.locals.decoded.id,
    };

    if (userTypes) {
      filters.userType = { $in: userTypes };
    }

    const user = await User.findOne(filters);

    if (!user) {
      return res.status(401).send();
    } else {
      body.user = user;
      return next();
    }
  } catch (error) {
    return res.status(500).send({ error });
  }
};

/**
 * Checks if the logged in user is a User.
 * User object from database is populated to req.body.agency
 * @param {String} res.locals.decoded.id - UsersId (UserId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const isUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return doesUserExist(undefined, req, res, next);
};

/**
 * Checks if the logged in user is an Admin.
 * User object of type Admin from database is populated to req.body.user
 * @param {String} res.locals.decoded.id - UsersId (AdminId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return doesUserExist(["Admin"], req, res, next);
};

/**
 * Checks if the logged in user is a Business.
 * User object of type Business from database is populated to req.body.user
 * @param {String} res.locals.decoded.id - UsersId (BusinessId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const isBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return doesUserExist(["Business"], req, res, next);
};

/**
 * Checks if the logged in user is an Agency.
 * User object of type Agency from database is populated to req.body.user
 * @param {String} res.locals.decoded.id - UsersId (AgencyId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const isAgency = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return doesUserExist(["Agency"], req, res, next);
};

/**
 * Checks if the logged in user is a Worker.
 * User object of type Worker from database is populated to req.body.user
 * @param {String} res.locals.decoded.id - UsersId (WorkerId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const isWorker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return doesUserExist(["Worker"], req, res, next);
};

/**
 * Checks if the logged in user is a Business, Admin or Agency.
 * User object of type Business, Admin or Agency from database is populated to req.body.user
 * @param {String} res.locals.decoded.id - UsersId (WorkerId) from token.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const isBusinessOrAdminOrAgency = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return doesUserExist(["Business", "Admin", "Agency"], req, res, next);
};

export default {};
