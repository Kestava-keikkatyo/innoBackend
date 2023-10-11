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
export const postReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req;
    //console.log('reportMiddleware.postReport: body: ',body)
    if (!body.agency && !body.business)
      return res.status(400).send({ error: "Agency and Business can't be both empty!" });
    const reportDocument: IReportDocument = new Report({
      user: res.locals.userId,
      business: body.business,
      agency: body.agency,
      date: body.date,
      type: body.type,
      title: body.title,
      title2: body.title2,
      details: body.details,
      details2: body.details2,
      //  fileUrl: body.fileUrl,
      //  fileType: body.fileType,
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
export const getMyReports = (_req: Request, res: Response, next: NextFunction) => {
  try {
    Report.find({ user: res.locals.userId }, (error: CallbackError, docs: IReportDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No reports found!" });
      }
      return res.status(200).json(docs);
    })
      .populate("user", {
        name: 1,
      })
      .populate("agency", {
        name: 1,
        userType: 1,
      })
      .populate("business", {
        name: 1,
        userType: 1,
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
export const getAllReports = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reports: Array<IReportDocument> | null = await Report.find({})
      .populate("user", {
        name: 1,
      })
      .populate("agency", {
        name: 1,
        userType: 1,
      })
      .populate("business", {
        name: 1,
        userType: 1,
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
export const getReportById = (req: Request, res: Response, next: NextFunction) => {
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
    })
      .populate("user", {
        name: 1,
        email: 1,
        phoneNumber: 1,
        street: 1,
        zipCose: 1,
        city: 1,
      })
      .populate("agency", {
        name: 1,
        userType: 1,
      })
      .populate("business", {
        name: 1,
        userType: 1,
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
export const replyReport = async (req: Request<{ id: string }, IReport>, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const { id } = params;
  //console.log('reportMiddleware: replyReport: body:', body)
  try {
    let report;
    switch (body.userType) {
      case "business":
        report = await Report.findOneAndUpdate(
          { _id: id, business: res.locals.userId },
          { businessReply: body.reply, status: "replied" },
          { new: true, runValidators: true, lean: true }
        );
        break;
      case "agency":
        report = await Report.findOneAndUpdate(
          { _id: id, agency: res.locals.userId },
          { agencyReply: body.reply, status: "replied" },
          { new: true, runValidators: true, lean: true }
        );
        break;
    }

    if (report) {
      console.log(`Report was replied successfully!`);
    }
    return res.status(report ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Archive report by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Archived report
 */
export const archiveReport = async (
  req: Request<{ id: string; archived: string }, IReport>,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { id, archived } = params;

  try {
    let report;
    switch (body.userType) {
      case "business":
        report = await Report.findOneAndUpdate(
          { _id: id, business: res.locals.userId },
          { businessArchived: archived },
          { new: true, runValidators: true, lean: true }
        );
        break;
      case "agency":
        report = await Report.findOneAndUpdate(
          { _id: id, agency: res.locals.userId },
          { agencyArchived: archived },
          { new: true, runValidators: true, lean: true }
        );
        break;
      case "worker":
        report = await Report.findOneAndUpdate(
          { _id: id, user: res.locals.userId },
          { workerArchived: archived },
          { new: true, runValidators: true, lean: true }
        );
        break;
      default:
        break;
    }

    if (report) {
      switch (archived) {
        case "true":
          console.log(`Report was archived successfully!`);
          break;
        case "false":
          console.log(`Report was UNarchived successfully!`);
          break;
      }
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
export const getReportsForReceiver = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let reports;

    switch (_req.body.user.userType) {
      case "business":
        reports = await Report.find({
          business: res.locals.userId,
        })
          .populate("user", {
            name: 1,
            email: 1,
            phoneNumber: 1,
          })
          .populate("agency", {
            name: 1,
            userType: 1,
          })
          .populate("business", {
            name: 1,
            userType: 1,
          });
        break;
      case "agency":
        reports = await Report.find({
          agency: res.locals.userId,
        })
          .populate("user", {
            name: 1,
            email: 1,
            phoneNumber: 1,
          })
          .populate("agency", {
            name: 1,
            userType: 1,
          })
          .populate("business", {
            name: 1,
            userType: 1,
          });
        break;
    }

    if (reports != null && reports.length > 0) {
      return res.status(200).json(reports);
    }
    return res.status(404).json({ message: "No reports found!" });
  } catch (exception) {
    return next(exception);
  }
};
