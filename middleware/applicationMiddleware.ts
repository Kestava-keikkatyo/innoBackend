import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Application from "../models/Application";
import { IApplicationDocument } from "../objecttypes/modelTypes";

/**
 * Post a new application to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New application document
 */
export const postapplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const applicationDocument: IApplicationDocument = new Application({
      user: res.locals.decoded.id,
      job: body.job,
      status: body.status,
    });
    const application = await applicationDocument.save();
    if (!application) {
      return res
        .status(400)
        .send({ error: "Failed to create the application!" });
    }
    return res.status(200).send(application);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get all applications.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All applications
 */
export const getAllApplications = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const applications: Array<IApplicationDocument> | null =
      await Application.find({});
    if (applications) {
      return res.status(200).json(applications);
    }
    return res.status(404).json({ message: "No applications found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get application by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Application
 */
export const getApplicationById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Application.findById(
      id,
      (error: CallbackError, doc: IApplicationDocument | null) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!doc) {
          return res.status(404).send({ message: `Application is not found!` });
        }
        return res.status(200).send(doc);
      }
    );
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get all workers's applications.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Worker's applications
 */
export const getWorkerApplications = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    Application.find(
      { user: res.locals.decoded.id },
      (error: CallbackError, docs: IApplicationDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No applications found!" });
        }
        return res.status(200).json(docs);
      }
    ).populate("user", {
      name: 1,
    });
  } catch (exception) {
    return next(exception);
  }
};
