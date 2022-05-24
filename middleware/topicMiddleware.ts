import { NextFunction, Request, Response } from "express";
import Topic from "../models/Topic";
import { ITopicDocument } from "../objecttypes/modelTypes";

/**
 * Post new info to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New topic document
 */
export const postTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const topicDocument: ITopicDocument = new Topic({
      user: res.locals.userId,
      question: body.question,
      answer: body.answer,
    });
    const topic = await topicDocument.save();
    if (!topic) {
      return res.status(400).send({ error: "Failed to create the topic!" });
    }
    return res.status(200).send(topic);
  } catch (exception) {
    return next(exception);
  }
};
