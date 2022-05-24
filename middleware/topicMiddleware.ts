import { NextFunction, Request, Response } from "express";
import Topic from "../models/Topic";
import { ITopicDocument } from "../objecttypes/modelTypes";
import { CallbackError } from "mongoose";

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

/**
 * Get all topics.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All topics
 */
export const getAllTopics = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topics: Array<ITopicDocument> | null = await Topic.find({});
    if (topics) {
      return res.status(200).json(topics);
    }
    return res.status(404).json({ message: "No topics found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get topic by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Topic
 */
export const getTopicById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Topic.findById(id, (error: CallbackError, doc: ITopicDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No topic found!` });
      }
      return res.status(200).send(doc);
    });
  } catch (exception) {
    return next(exception);
  }
};
