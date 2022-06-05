import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import FeedBack from "../models/FeedBack";
import { IFeedbackDocument } from "../objecttypes/modelTypes";
import { copyProperties } from "../utils/common";

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
export const getMyFeedbacks = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    FeedBack.find(
      { user: res.locals.userId },
      (error: CallbackError, docs: IFeedbackDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No feedbacks found!" });
        }
        return res.status(200).json(docs);
      }
    );
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
export const getFeedbackById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    FeedBack.findById(
      id,
      (error: CallbackError, doc: IFeedbackDocument | null) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!doc) {
          return res.status(404).send({ message: `No feedback found!` });
        }
        return res.status(200).send(doc);
      }
    );
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
    const feedbacks: Array<IFeedbackDocument> | null = await FeedBack.find({});
    if (feedbacks) {
      return res.status(200).json(feedbacks);
    }
    return res.status(404).json({ message: "No feedbacks found!" });
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
