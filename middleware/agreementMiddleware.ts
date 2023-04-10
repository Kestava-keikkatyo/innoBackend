import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Agreement from "../models/Agreement";
import { IAgreement, IAgreementDocument, IEmploymentAgreementDocument } from "../objecttypes/modelTypes";
import User from "../models/User";
import EmploymentAgreement from "../models/EmploymentAgreement";

/*
 * @deprecated This request cabability is not included in current iteration.
 * Post a new agreement to database.
 * Agreement type is 'request' if sent by Worker or Business and 'agreement' if sent by Agency.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New agreement document

export const postAgreement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const agreementDocument: IAgreementDocument | null =
      await Agreement.findOne({
        target: body.user._id,
        creator: body.target,
        type: "request",
      });

    if (agreementDocument) {
      Agreement.findByIdAndUpdate(agreementDocument.id, {
        form: body.form,
        type: "agreement",
        createdAt: new Date(),
      });
    } else {
      const agreementDocument: IAgreementDocument = new Agreement({
        creator: body.type != "request" ? body.user._id : body.target,
        target: body.type != "request" ? body.target : body.user._id,
        form: body.type != "request" ? body.form : null,
        type: body.type,
        status: body.type != "request" ? "pending" : "request",
      });
      const agreement = await agreementDocument.save();
      if (!agreement) {
        return res
          .status(400)
          .send({ error: "Failed to create an agreement!" });
      }
      return res.status(200).send(agreement);
    }
  } catch (exception) {
    return next(exception);
  }
};
*/

/**
 * Post a new agency agreement to database.
 * Meant to be used by agencies.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New agreement document
 */
export const postAgreement = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const agreementDocument: IAgreementDocument | null = await Agreement.findOne({
      target: body.user,
      creator: res.locals.creator,
    });

    if (agreementDocument) {
      return res.status(400).send({ error: "Agreement already exists" });
    } else {
      const agreementDocument: IAgreementDocument = new Agreement({
        target: body.user,
        creator: res.locals.creator,
      });
      const agreement = await agreementDocument.save();
      if (!agreement) {
        return res.status(400).send({ error: "Failed to create an agreement!" });
      }
      next();
      return res.status(200).send(agreement);
    }
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Post a new employment agreement to database.
 * Meant to be used by agencies.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New employment agreement document
 */ 
export const postEmploymentAgreement = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  //console.log("BODY: " + JSON.stringify(body))
  try {
    const existingDocument: IEmploymentAgreementDocument | null = await EmploymentAgreement.findOne({
      worker: body.worker,
      business: body.business
    });

    if (existingDocument) {
      return res.status(400).send({ error: "Agreement already exists" });
    } else {
      const empAgreementDocument: IEmploymentAgreementDocument = new EmploymentAgreement({
        creator: body.user._id,
        worker: body.worker,
        business: body.business,
        status: "pending"
      });
      const agreement = await empAgreementDocument.save();
      if (!agreement) {
        return res.status(400).send({ error: "Failed to create an agreement!" });
      }
      return res.status(200).send(agreement);
    }
  } catch (exception) {
    return next(exception);
  }
}; 

/**
 * Get worker's or business's employment agreements.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's agreements
 */
export const getEmploymentAgreements = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;

  try {
    EmploymentAgreement.find({ 
      $or: 
      [ { worker: body.user._id },
        { business: body.user._id } ]
      }
      , (error: CallbackError, docs: IEmploymentAgreementDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No agreements found!" });
      }
      return res.status(200).json(docs);
    }).populate("creator", {companyName: 1}, User)
    .populate("worker", { email: 1 }, User)
    .populate("business", {companyName: 1}, User);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get agency's agreements.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's agreements
 */
export const getMyAgreements = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    Agreement.find({ creator: body.user._id }, (error: CallbackError, docs: IAgreementDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No agreements found!" });
      }
      return res.status(200).json(docs);
    }).populate("target", { email: 1 }, User);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get agency's signed agreements.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's agreements
 */
export const getMySignedAgreements = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;

  try {
    Agreement.find({ creator: body.user._id, signed: { $ne: null } }, (error: CallbackError, docs: IAgreementDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No agreements found!" });
      }
      return res.status(200).json(docs);
    })
      .populate("target", { name: 1 }, User);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get agreements user is target of.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's agreements
 */
export const getTargetAgreements = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;

  try {
    Agreement.find({ target: body.user._id }, (error: CallbackError, docs: IAgreementDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No agreements found!" });
      }
      return res.status(200).json(docs);
    }).populate("creator", { companyName: 1 }, User)
    .populate("target", { email: 1 }, User);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get signed agreements user is target of.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User's agreements
 */
export const getSignedTargetAgreements = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;

  try {
    Agreement.find({ creator: body.user._id, signed: { $ne: null } }, (error: CallbackError, docs: IAgreementDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No agreements found!" });
      }
      return (res.status(200).json(docs));
    }).populate("creator", { name: 1 }, User);

  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get agreement by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Agreement
 */
export const getAgreementById = (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Agreement.findById(id, (error: CallbackError, doc: IAgreementDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No agreements found!` });
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
 * Update agreement.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated agreement
 */
export const updateAgreement = async (req: Request<{ id: string }, IAgreement>, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const { id } = params;
  const { form } = body;

  try {
    const agreement: IAgreementDocument | null = await Agreement.findByIdAndUpdate(
      id,
      { form },
      { new: true, runValidators: true, lean: true }
    );
    if (agreement) {
      console.log(`Agreement was updated successfuly!!`);
    }
    return res.status(agreement ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Sign agreement.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Signed agreement
 */
export const signAgreement = async (
  req: Request<{ id: string; status: string }, IAgreement>,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const { id } = params;
  const { status } = params;

  try {
    switch (status.toLowerCase()) {
      case "signed":
        break;
      case "rejected":
        break;
      case "terminated":
        break;
      default:
        return res.status(500).json("Wrong parameter given.");
    }

    const agreement: IAgreementDocument | null = await Agreement.findByIdAndUpdate(
      id,
      { status: status, signed: new Date() },
      { new: true, runValidators: true, lean: true }
    );
    if (agreement) {
      console.log(`Agreement was signed!`);
    }
    return res.status(agreement ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Delete agreement by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted agreement
 */
export const deleteAgreement = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const { id } = params;

  try {
    const agreement: IAgreementDocument | null = await Agreement.findByIdAndDelete({
      _id: id,
    });

    if (!agreement) {
      return res.status(404).send({ message: `Agreement does not exist!` });
    } else {
      return res.status(200).send({ message: `Agreement was deleted successfully!` });
    }
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Delete employment agreement by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted employment agreement
 */
export const deleteEmploymentAgreement = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const { id } = params;

  try {
    const agreement: IEmploymentAgreementDocument | null = await EmploymentAgreement.findByIdAndDelete({
      _id: id,
    });

    if (!agreement) {
      return res.status(404).send({ message: `Agreement does not exist!` });
    } else {
      return res.status(200).send({ message: `Agreement was deleted successfully!` });
    }
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Sign employment agreement by id. 
 * Checks also if both business and worker have signed the agreement, 
 * and changes the status to "signed" if needed.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated employment agreement
 */
export const signEmploymentAgreement = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  const { params } = req
  const { id } = params;

  let agreement: IEmploymentAgreementDocument | null = await EmploymentAgreement.findById(id)

  try {
    if (agreement && body.user.userType === "worker" && !agreement.workerSigned) {
      agreement.workerSigned = new Date()
      if (agreement.businessSigned) {
        agreement.status = "signed"
      }
      await EmploymentAgreement.findByIdAndUpdate(
        id, 
        { workerSigned: agreement.workerSigned, status: agreement.status },
        { new: true, runValidators: true, lean: true }
      ); 

  } else if (agreement && body.user.userType === "business" && !agreement.businessSigned) {
      agreement.businessSigned = new Date()
      if (agreement.workerSigned) {
        agreement.status = "signed"
      }
      await EmploymentAgreement.findByIdAndUpdate(
      id, 
      { businessSigned: agreement.businessSigned, status: agreement.status },
      { new: true, runValidators: true, lean: true }
    ); 
  }

  if (!agreement) {
    return res.status(404).send({ message: `Agreement does not exist!` });
  } else {
    return res.status(200).send({ message: `Agreement was signed successfully!` });
  }
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Reject employment agreement by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Rejected employment agreement
 */
export const rejectEmploymentAgreement = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const { id } = params;

  try {
    const agreement: IEmploymentAgreementDocument | null = await EmploymentAgreement.findByIdAndUpdate(
      id, 
      { status: "rejected" },
      { new: true, runValidators: true, lean: true }
    )

    if (!agreement) {
      return res.status(404).send({ message: `Agreement does not exist!` });
    } else {
      return res.status(200).send({ message: `Agreement was rejected successfully!` });
    }
  } catch (exception) {
    return next(exception);
  }
};
