import { NextFunction, Request, Response } from "express";
import Feeling from "../models/Feeling";
import { IFeelingDocument } from "../objecttypes/modelTypes";
import { copyProperties } from "../utils/common";

const updatableFields = [
  "comfortable",
  "satisfied",
  "energetic",
  "enthusiastic",
  "frustrated",
  "stressed",
  "anxious",
  "comment",
];

/**
 * Post worker's feeling to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New feeling document
 */
export const postFeeling = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const feelingDocument: IFeelingDocument = new Feeling({
      worker: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const feeling = await feelingDocument.save();
    if (!feeling) {
      return res.status(400).send({ error: "Failed to post feeling!" });
    }
    return res.status(200).send(feeling);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get user's feeling.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's feelings
 */
export const getMyFeelings = async (_req: Request, res: Response, next: NextFunction) => {
  const id: string = res.locals.userId;
  try {
    const feelings: IFeelingDocument[] | null = await Feeling.find({
      worker: id,
    });
    if (!feelings) {
      return res.status(404).send({});
    }
    return res.status(200).send(feelings);
  } catch (exception) {
    return next(exception);
  }
};
