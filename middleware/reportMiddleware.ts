import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Report from "../models/Report";
import { IReport, IReportDocument } from "../objecttypes/modelTypes";

/**
 * Post a new report to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New report document
 */
export const postReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { body } = req;
    if(body.agency && body.business)
      return res.status(400).send({ error: "Agency and Business can't be both empty!" });

    const reportDocument: IReportDocument = new Report({
      user: res.locals.decoded.id,
      business: body.business,
      agency: body.agency,
      date: body.date,
      title: body.title,
      details: body.details,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
    });

    const report = await reportDocument.save();
    if (!report) {
      return res.status(400).send({ error: "Failed to send report!" });
    }
    return res.status(200).send(report);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get workers's reports.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Workers's reports
 */
export const getMyReports = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    Report.find(
      { user: res.locals.decoded.id },
      (error: CallbackError, docs: IReportDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No reports found!" });
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
 * Get all reports.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All reports
 */
export const getAllReports = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reports: Array<IReportDocument> | null = await Report.find(
      {}
    ).populate("user", {
      name: 1,
    });
    if (reports) {
      return res.status(200).json(reports);
    }
    return res.status(404).json({ message: "No reports found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get report by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Report
 */
export const getReportById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Report.findById(id, (error: CallbackError, doc: IReportDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No report found!` });
      }
      return res.status(200).send(doc);
    }).populate("user", {
      name: 1,
      email: 1,
      phoneNumber: 1,
      street: 1,
      zipCose: 1,
      city: 1,
    });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Reply report by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Replied report
 */
export const replyReport = async (
  req: Request<{ id: string }, IReport>,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { id } = params;

  try {
    const report: IReportDocument | null = await Report.findByIdAndUpdate(
      id,
      { reply: body.reply, status: "replied" },
      { new: true, runValidators: true, lean: true }
    );
    if (report) {
      console.log(`Report was replied successfully!`);
    }
    return res.status(report ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get all reports for receiver.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All reports for receiver
 */
export const getReportsForReceiver = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reports: Array<IReportDocument> | null =
      await Report.find({
        business: res.locals.decoded.id
      }).populate("user", {
        name: 1, email: 1, phoneNumber: 1
      });
    if (reports) {
      return res.status(200).json(reports);
    }
    return res.status(404).json({ message: "No reports found!" });
  } catch (exception) {
    return next(exception);
  }
};
