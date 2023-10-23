import { NextFunction, Request, Response } from "express";
import Topic from "../models/Topic";
import { ITopicDocument } from "../objecttypes/modelTypes";
import { copyProperties, removeEmptyProperties } from "../utils/common";

const updatableFields = ["question", "answer"];

/**
 * Post new info to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New topic document
 */
export const postTopic = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const topicDocument: ITopicDocument = new Topic({
      user: res.locals.userId,
      ...copyProperties(body, updatableFields),
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
export const getAllTopics = async (_req: Request, res: Response, next: NextFunction) => {
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
export const getTopicById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const doc: ITopicDocument | null = await Topic.findById({
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
 * Update topic by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated topic
 */
export const updateTopic = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const updatedTopic = removeEmptyProperties({
      ...copyProperties(body, updatableFields),
    });

    const topic: ITopicDocument | null = await Topic.findOneAndUpdate({ _id: id, user: userId }, updatedTopic, {
      new: true,
      runValidators: true,
      lean: true,
    });
    return res.status(topic ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to delete topic by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted topic
 */
export const deleteTopic = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const topic: ITopicDocument | null = await Topic.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!topic) {
      return res.status(404).send({ message: `Topic is not existing!` });
    } else {
      return res.status(200).send({ message: `Topic was deleted successfuly!` });
    }
  } catch (exception) {
    return next(exception);
  }
};
