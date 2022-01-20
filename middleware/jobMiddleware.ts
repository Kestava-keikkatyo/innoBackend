import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Job from "../models/Job";
import { IJobDocument } from "../objecttypes/modelTypes";

/**
 * This function is used to post a new job to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New job document
 */
export const postJobDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const jobDocument: IJobDocument = new Job({
      agency: res.locals.decoded.id,
      title: body.title,
      category: body.category,
      jobType: body.jobType,
      location: {
        street: body.location.street,
        zipCode: body.location.zipCode,
        city: body.location.city,
      },
      salary: body.salary,
      requirements: body.requirements,
      desirableSkills: body.desirableSkills,
      benefits: body.benefits,
      details: body.details,
      duration: {
        startDate: body.duration.startDate,
        endDate: body.duration.endDate,
        lastApplicationDate: body.duration.lastApplicationDate,
      },
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
 * This function is used to get all jobs.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All jobs
 */
export const getJobDocuments = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobs: Array<IJobDocument> | null = await Job.find({}).populate(
      "agency",
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
 * This function is used to get agency's jobs.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Agency's jobs
 */
export const getJobDocumentsForAgency = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    Job.find(
      { agency: res.locals.decoded.id },
      (error: CallbackError, docs: IJobDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No jobs found!" });
        }
        return res.status(200).json(docs);
      }
    );
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Job
 */
export const getJobDocumentById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to update job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated job
 */
export const updateJobDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { id } = params;

  try {
    const job: IJobDocument | null = await Job.findByIdAndUpdate(
      { _id: id },
      { ...body },
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
 * This function is used to delete job by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted job
 */
export const deleteJobDocument = async (
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
