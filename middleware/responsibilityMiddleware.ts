import { NextFunction, Request, Response } from "express";
import Responsibility from "../models/Responsibility";
import { IResponsibilityDocument } from "../objecttypes/modelTypes";
import { copyProperties } from "../utils/common";

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
