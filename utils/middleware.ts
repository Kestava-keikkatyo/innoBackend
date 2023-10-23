/** Contains all middleware functions that are used in routes.
 * @module utils/middleware
 * @requires logger
 * @requires Worker
 * @requires Business
 * @requires Agency
 */
import { NextFunction, Request, Response } from "express";
import { error as _error, info } from "./logger";

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  info("Method:", req.method);
  info("Path:  ", req.path);
  info("Body:  ", req.body);
  info("---");
  next();
};

export const unknownEndpoint = (_req: Request, res: Response) => {
  res.status(404).send({ error: "unknown endpoint" });
};

export const errorHandler = (err: any, _req: Request, res: Response, next: NextFunction): any => {
  _error(err.message);

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).send({ error: "malformatted id" });
  } else if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
};

export default {};
