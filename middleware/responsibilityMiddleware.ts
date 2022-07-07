import { NextFunction, Request, Response } from "express";
import Responsibility from "../models/Responsibility";
import { IResponsibilityDocument } from "../objecttypes/modelTypes";
import { copyProperties, removeEmptyProperties } from "../utils/common";

const updatableFields = ["responsible", "rule"];

/**
 * Post new responsibility to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New responsibility document
 */
export const postResponsibility = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const responsibilityDocument: IResponsibilityDocument = new Responsibility({
      user: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const responsibility = await responsibilityDocument.save();
    if (!responsibility) {
      return res.status(400).send({ error: "Failed to create the responsibility!" });
    }
    return res.status(200).send(responsibility);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get all responsibilities.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All responsibilities
 */
export const getAllResponsibilities = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const responsibilities: Array<IResponsibilityDocument> | null = await Responsibility.find({});
    if (responsibilities) {
      return res.status(200).json(responsibilities);
    }
    return res.status(404).json({ message: "No responsibilities found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get all responsibilities based on user type.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All responsibilities based on user type
 */
export const getMyResponsibilities = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const responsibilities: Array<IResponsibilityDocument> | null = await Responsibility.find({
      responsible: body.user.userType,
    });
    if (responsibilities) {
      return res.status(200).json(responsibilities);
    }
    return res.status(404).json({ message: "No responsibilities found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get responsibility by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Responsibility
 */
export const getResponsibilityById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const responsibility: IResponsibilityDocument | null = await Responsibility.findById({
      _id: id,
    });
    if (!responsibility) {
      return res.status(404).send({});
    }
    return res.status(200).send(responsibility);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Update responsibility by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated responsibility
 */
export const updateResponsibility = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const updatedResponsibility = removeEmptyProperties({
      ...copyProperties(body, updatableFields),
    });

    const responsibility: IResponsibilityDocument | null = await Responsibility.findOneAndUpdate(
      { _id: id, user: userId },
      updatedResponsibility,
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    );
    return res.status(responsibility ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to delete responsibility by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted responsibility
 */
export const deleteResponsibility = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const responsibility: IResponsibilityDocument | null = await Responsibility.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!responsibility) {
      return res.status(404).send({ message: `Responsibility is not existing!` });
    } else {
      return res.status(200).send({ message: `Responsibility was deleted successfuly!` });
    }
  } catch (exception) {
    return next(exception);
  }
};
