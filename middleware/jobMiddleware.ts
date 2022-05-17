import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Job from "../models/Job";
import { IJobDocument } from "../objecttypes/modelTypes";
import { removeEmptyProperties } from "../utils/common";

/**
 * Post a new job to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New job document
 */
export const postJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const jobDocument: IJobDocument = new Job({
      user: res.locals.userId,
      title: body.title,
      category: body.category,
      jobType: body.jobType,
      street: body.street,
      zipCode: body.zipCode,
      city: body.city,
      salary: body.salary,
      requirements: body.requirements,
      desirableSkills: body.desirableSkills,
      benefits: body.benefits,
      details: body.details,
      startDate: body.startDate,
      endDate: body.endDate,
      applicationLastDate: body.applicationLastDate,
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
 * Get all jobs.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All jobs
 */
export const getAllJobs = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobs: Array<IJobDocument> | null = await Job.find({}).populate(
      "user",
      {
        name: 1,
      }
    );
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
export const getMyJobs = (_req: Request, res: Response, next: NextFunction) => {
  try {
    Job.find(
      { user: res.locals.userId },
      (error: CallbackError, docs: IJobDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No jobs found!" });
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

/**
 * Get job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Job
 */
export const getJobById = (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Job.findById(id, (error: CallbackError, doc: IJobDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No job with ID ${id} found!` });
      }
      return res.status(200).send(doc);
    }).populate("user", {
      name: 1,
    });
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
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { id } = params;

  try {
    const updatableFields = removeEmptyProperties({
      title: body.title,
      category: body.category,
      jobType: body.jobType,
      street: body.street,
      zipCode: body.zipCode,
      city: body.city,
      salary: body.salary,
      requirements: body.requirements,
      desirableSkills: body.desirableSkills,
      benefits: body.benefits,
      details: body.details,
      startDate: body.startDate,
      endDate: body.endDate,
      applicationLastDate: body.applicationLastDate,
    });

    const job: IJobDocument | null = await Job.findByIdAndUpdate(
      id,
      updatableFields,
      { new: true, runValidators: true, lean: true }
    );
    if (job) {
      console.log(`Job with ${id} was updated!`);
    }
    return res.status(job ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Add applicant by job id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated job
 */
export const addApplicant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const { jobId, userId } = params;
  const { body } = req;
  const { coverLetter, cv } = body;

  try {
    const job: IJobDocument | null = await Job.findByIdAndUpdate(
      { _id: jobId },
      {
        $push: { applicants: { id: userId, coverLetter: coverLetter, cv: cv } },
      },
      { new: true, runValidators: true, lean: true }
    );
    if (job) {
      console.log(`Job with ${jobId} was updated!`);
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
export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const { id } = params;

  try {
    const job: IJobDocument | null = await Job.findByIdAndDelete({
      _id: id,
    });

    if (!job) {
      return res
        .status(404)
        .send({ message: `Job with ID ${id}  is not existing!` });
    } else {
      return res
        .status(200)
        .send({ message: `Job with ${id} was deleted successfuly!` });
    }
  } catch (exception) {
    return next(exception);
  }
};
