import { NextFunction, Request, Response } from "express";
import WorkRequest from "../models/WorkRequest";
import { IWorkRequestDocument } from "../objecttypes/modelTypes";
import { addUserNotification, copyProperties, removeEmptyProperties } from "../utils/common";

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
export const postWorkRequest = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const workRequestDocument: IWorkRequestDocument = new WorkRequest({
      sender: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const workRequest = await workRequestDocument.save();
    if (!workRequest) {
      return res.status(400).send({ error: "Failed to create a work request!" });
    }
    addUserNotification(
      {
        sender: res.locals.userId,
        target: workRequest._id,
        targetDoc: "WorkRequest",
        type: "assignmet",
      },
      body.recipient
    );
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
export const getMyWorkRequests = async (_req: Request, res: Response, next: NextFunction) => {
  const id: string = res.locals.userId;
  try {
    const docs: IWorkRequestDocument[] | null = await WorkRequest.find({
      sender: id,
    }).populate("recipient", {
      name: 1,
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
 * Get user's received work requests.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns user's received work requests
 */
export const getReceivedWorkRequests = async (_req: Request, res: Response, next: NextFunction) => {
  const id: string = res.locals.userId;
  try {
    const docs: IWorkRequestDocument[] | null = await WorkRequest.find({
      recipient: id,
    }).populate("sender", {
      name: 1,
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
export const getWorkRequestById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const doc: IWorkRequestDocument | null = await WorkRequest.findOne({
      _id: id,
      sender: userId,
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
 * Update work request by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated work request
 */
export const updateWorkRequest = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const updatedWorkRequest = removeEmptyProperties({
      ...copyProperties(body, updatableFields),
    });

    const workRequest: IWorkRequestDocument | null = await WorkRequest.findOneAndUpdate(
      { _id: id, sender: userId },
      updatedWorkRequest,
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    );
    return res.status(workRequest ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};
