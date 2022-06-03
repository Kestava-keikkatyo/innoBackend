import { NextFunction, Request, Response } from "express";
import WorkRequest from "../models/WorkRequest";
import { IWorkRequestDocument } from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";
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
export const getMyWorkRequests = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    WorkRequest.find(
      { user: res.locals.userId },
      (error: CallbackError, docs: IWorkRequestDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No work requests found!" });
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
