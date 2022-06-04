import { NextFunction, Request, Response } from "express";
import WorkRequest from "../models/WorkRequest";
import { IWorkRequestDocument } from "../objecttypes/modelTypes";
import { copyProperties } from "../utils/common";

const updatableFields = [
  "recipient",
  "headline",
  "workersNumber",
  "requirements",
  "desirableSkills",
  "details",
  "startDate",
  "endDate",
];
/**
 * Post a new work request to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New work request document
 */
export const postWorkRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const workRequestDocument: IWorkRequestDocument = new WorkRequest({
      sender: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const workRequest = await workRequestDocument.save();
    if (!workRequest) {
      return res
        .status(400)
        .send({ error: "Failed to create a work request!" });
    }
    return res.status(200).send(workRequest);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get user's work requests.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns user's work requests
 */
export const getMyWorkRequests = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const id: string = res.locals.userId;
  try {
    const docs: Array<IWorkRequestDocument> | null = await WorkRequest.find({
      sender: id,
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
 * Get work request by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Work request
 */
export const getWorkRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const docs: IWorkRequestDocument | null = await WorkRequest.findById(id);
    if (!docs) {
      return res.status(404).send({});
    }
    return res.status(200).send(docs);
  } catch (exception) {
    return next(exception);
  }
};
