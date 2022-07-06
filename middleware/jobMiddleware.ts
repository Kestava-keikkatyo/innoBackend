import { NextFunction, Request, Response } from "express";
import Job from "../models/Job";
import { IJobDocument } from "../objecttypes/modelTypes";
import { copyProperties, removeEmptyProperties } from "../utils/common";

const updatableFields = [
  "title",
  "category",
  "jobType",
  "street",
  "zipCode",
  "city",
  "salary",
  "requirements",
  "desirableSkills",
  "benefits",
  "details",
  "startDate",
  "endDate",
  "applicationLastDate",
];

/**
 * Post a new job to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New job document
 */
export const postJob = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const jobDocument: IJobDocument = new Job({
      user: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const job = await jobDocument.save();
    if (!job) {
      return res.status(400).send({ error: "Failed to create a job!" });
    }
    return res.status(200).send(job);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get all job ads.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All job ads
 */
export const getJobAds = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs: Array<IJobDocument> | null = await Job.find({}).populate("user", {
      name: 1,
    });
    if (jobs) {
      return res.status(200).json(jobs);
    }
    return res.status(404).json({ message: "No jobs found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get agency's jobs.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Agency's jobs
 */
export const getMyJobs = async (_req: Request, res: Response, next: NextFunction) => {
  const id: string = res.locals.userId;
  try {
    const docs: IJobDocument[] | null = await Job.find({
      user: id,
    }).populate("user", {
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
 * Get job by id for creator.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's created job
 */
export const getMyJobById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const doc: IJobDocument | null = await Job.findOne({
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
 * Get job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Job
 */
export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const doc: IJobDocument | null = await Job.findById({
      _id: id,
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
 * Get latest jobs.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Latest job ads
 */
export const getLatestJobs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs: Array<IJobDocument> | null = await Job.find().sort({ createdAt: -1 }).limit(30).populate("user", {
      name: 1,
    });
    if (jobs) {
      return res.status(200).json(jobs);
    }
    return res.status(404).json({ message: "No jobs found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Update job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated job
 */
export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const updatedJob = removeEmptyProperties({
      ...copyProperties(body, updatableFields),
    });

    const job: IJobDocument | null = await Job.findOneAndUpdate({ _id: id, user: userId }, updatedJob, {
      new: true,
      runValidators: true,
      lean: true,
    });
    if (job) {
      console.log(`Job with ${id} was updated!`);
    }
    return res.status(job ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to delete job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted job
 */
export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;

  try {
    const job: IJobDocument | null = await Job.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!job) {
      return res.status(404).send({ message: `Requested job is not existing!` });
    } else {
      return res.status(200).send({ message: `Job was deleted successfuly!` });
    }
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Update job status.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated job
 */
export const updateJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const userId: string = res.locals.userId;
  const id: string = params.id;
  const { active } = body;

  try {
    const job: IJobDocument | null = await Job.findOneAndUpdate(
      { _id: id, user: userId },
      { active },
      { new: true, runValidators: true, lean: true }
    );
    if (job) {
      console.log(`job was deactivated!`);
    }
    return res.status(job ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};
