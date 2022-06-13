import { NextFunction, Request, Response } from "express";
import Application from "../models/Application";
import { IApplicationDocument } from "../objecttypes/modelTypes";
import { copyProperties } from "../utils/common";

const updatableFields = ["job", "explanation", "fileUrl", "status"];

/**
 * Post a new application to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New application document
 */
export const postApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const applicationDocument: IApplicationDocument = new Application({
      sender: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const application = await applicationDocument.save();
    if (!application) {
      return res.status(400).send({ error: "Failed to post the application!" });
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
export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const doc: IApplicationDocument | null = await Application.findById({
      _id: id,
    }).populate("user", {
      name: 1,
    });
    if (!doc) {
      return res.status(404).send({});
    }
    return res.status(200).send(doc);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get user's applications.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns user's applications
 */
export const getAllMyApplications = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const id: string = res.locals.userId;
  try {
    const docs: IApplicationDocument[] | null = await Application.find({
      user: id,
    });
    if (!docs) {
      return res.status(404).send({});
    }
    return res.status(200).send(docs);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get user's appliaction by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns user's application
 */
export const getMyApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const doc: IApplicationDocument | null = await Application.findOne({
      _id: id,
      user: userId,
    });
    if (!doc) {
      return res.status(404).send({});
    }
    return res.status(200).send(doc);
  } catch (exception) {
    return next(exception);
  }
};
