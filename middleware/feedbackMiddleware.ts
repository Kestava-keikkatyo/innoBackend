import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import FeedBack from "../models/FeedBack";
import { IFeedbackDocument } from "../objecttypes/modelTypes";
import { copyProperties, removeEmptyProperties } from "../utils/common";

const updatableFields = ["heading", "message"];
/**
 * Post a new feedback to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New feedback document
 */
export const postFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { body } = req;
    const feedbackDocument: IFeedbackDocument = new FeedBack({
      user: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });

    const feedback = await feedbackDocument.save();
    if (!feedback) {
      return res.status(400).send({ error: "Failed to create feedback!" });
    }
    return res.status(200).send(feedback);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get own feedbacks.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's feedbacks
 */
export const getMyFeedbacks = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const id: string = res.locals.userId;
  try {
    const docs: IFeedbackDocument[] | null = await FeedBack.find({
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
 * Get feedback by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Feedback
 */
export const getFeedbackById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const doc: IFeedbackDocument | null = await FeedBack.findById({
      _id: id,
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
 * Get all feedbacks.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All feedbacks
 */
export const getAllFeddbacks = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const feedbacks: IFeedbackDocument[] | null = await FeedBack.find({});
    if (feedbacks) {
      return res.status(200).json(feedbacks);
    }
    return res.status(404).json({ message: "No feedbacks found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Update feedback by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated feedback
 */
export const updateFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const updatedFeedback = removeEmptyProperties({
      ...copyProperties(body, updatableFields),
    });

    const feedback: IFeedbackDocument | null = await FeedBack.findOneAndUpdate(
      { _id: id, user: userId },
      updatedFeedback,
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    );
    return res.status(feedback ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * TO DO ckeck this method
 */
export const replyFeedback = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { body, params } = req;
    const updateFilter = { _id: params.feedbackId };
    const update = { $set: { reply: body.replyMessage } };

    return FeedBack.updateOne(
      updateFilter,
      update,
      undefined,
      (err: CallbackError, res: any) => {
        if (err)
          return res.status(500).send({ message: "Fatal error.", error: err });
        else if (!res)
          return res
            .status(404)
            .send({ message: "Feedback update result was empty." });
        else return res.status(200).send(res);
      }
    );
  } catch (exception) {
    return res.status(500).send({ exception });
  }
};

export default {};
