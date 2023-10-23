import { NextFunction, Request, Response } from "express";
import FeedBack from "../models/FeedBack";
import { IFeedbackDocument } from "../objecttypes/modelTypes";
import { addUserNotification, copyProperties } from "../utils/common";

const updatableFields = [
  "recipientId",
  "recipientName",
  "shift",
  "shiftMessage",
  "orientation",
  "orientationMessage",
  "reception",
  "receptionMessage",
  "appreciation",
  "appreciationMessage",
  "expectation",
  "expectationMessage",
  "additionalMessage",
  "senderId",
  "senderName",
  "anonymous",
];

/**
 * Post a new feedback to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New feedback document
 */
export const postFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req;
    // console.log("POST FEEDBACK" + JSON.stringify(body));
    console.log(body);
    const feedbackDocument: IFeedbackDocument = new FeedBack({
      ...copyProperties(body, updatableFields),
    });

    const feedback = await feedbackDocument.save();
    if (!feedback) {
      return res.status(400).send({ error: "Failed to create feedback!" });
    }
    addUserNotification(
      {
        sender: res.locals.userId,
        target: feedback._id,
        targetDoc: "FeedBack",
        type: "feedback_pending",
      },
      body.recipientId
    );
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
export const getMyFeedbacks = async (_req: Request, res: Response, next: NextFunction) => {
  const id: string = res.locals.userId;
  try {
    const docs: IFeedbackDocument[] | null = await FeedBack.find({
      senderId: id,
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
 * Get own feedbacks.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's feedbacks
 */
export const getFeedbacksAppointedToMe = async (_req: Request, res: Response, next: NextFunction) => {
  const id: string = res.locals.userId;
  try {
    const docs: IFeedbackDocument[] | null = await FeedBack.find({
      recipientId: id,
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
 * Get user's feedback by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's feedback
 */
export const getMyFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const doc: IFeedbackDocument | null = await FeedBack.findOne({
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

/**
 * Get received feedback by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Received feedback
 */
export const getReceivedFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const doc: IFeedbackDocument | null = await FeedBack.findOne({
      _id: id,
      recipient: userId,
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
 * Get feedback by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Feedback
 */
export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
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
export const getAllFeedbacks = async (_req: Request, res: Response, next: NextFunction) => {
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
export const updateFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body, params } = req;
    const feedbackId = params.id;

    const filterableFields = ["recipientId", "recipientName", "senderId", "senderName"];
    const cleanedFields = updatableFields.filter((field) => !filterableFields.includes(field));

    const feedback: IFeedbackDocument | null = await FeedBack.findByIdAndUpdate(
      { _id: feedbackId },
      { ...copyProperties(body, cleanedFields) },
      { new: true, runValidators: true, lean: true }
    );

    return res.status(feedback ? 200 : 404).send();
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
export const replyFeedback = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const feedback: IFeedbackDocument | null = await FeedBack.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $addToSet: { reply: body.reply } },
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

export default {};
