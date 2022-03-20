import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Agreement from "../models/Agreement";
import { IAgreement, IAgreementDocument } from "../objecttypes/modelTypes";

/**
 * Post a new agreement to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New agreement document
 */
export const postAgreement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const agreementDocument: IAgreementDocument = new Agreement({
      creator: body.user._id,
      target: body.target,
      form2: body.form2,
      status: "pending",
    });
    const agreement = await agreementDocument.save();
    if (!agreement) {
      return res.status(400).send({ error: "Failed to create an agreement!" });
    }
    return res.status(200).send(agreement);
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
export const getMyAgreements = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;

  try {
    Agreement.find(
      { creator: body.user._id },
      (error: CallbackError, docs: IAgreementDocument[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No agreements found!" });
        }
        return res.status(200).json(docs);
      }
    );
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
export const getTargetAgreements = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
  const { body } = req;

  try {
    Agreement.find(
        { target: body.user._id },
        (error: CallbackError, docs: IAgreementDocument[]) => {
          if (error) {
            return res.status(500).json({ message: error.message });
          }
          if (!docs.length) {
            return res.status(404).json({ message: "No agreements found!" });
          }
          return res.status(200).json(docs);
        }
    );
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
export const getAgreementById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Agreement.findById(
      id,
      (error: CallbackError, doc: IAgreementDocument | null) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!doc) {
          return res.status(404).send({ message: `No agreements found!` });
        }
        return res.status(200).send(doc);
      }
    ).populate("user", {
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
export const updateAgreement = async (
  req: Request<{ id: string }, IAgreement>,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { id } = params;
  const { form2 } = body;

  try {
    const agreement: IAgreementDocument | null =
      await Agreement.findByIdAndUpdate(
        id,
        { form2 },
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
  req: Request<{ id: string, status: string }, IAgreement>,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const { id } = params;
  const { status } = params;

  try {
    switch(status.toLowerCase()){
      case "signed":
        break;
      case "rejected":
        break;
      case "terminated":
        break;
      default:
        return res.status(500).json("Wrong parameter given.");
    }

    const agreement: IAgreementDocument | null =
      await Agreement.findByIdAndUpdate(
        id,
        { status: status },
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
export const deleteAgreement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const { id } = params;

  try {
    const agreement: IAgreementDocument | null =
      await Agreement.findByIdAndDelete({
        _id: id,
      });

    if (!agreement) {
      return res.status(404).send({ message: `Agreement  is not existing!` });
    } else {
      return res
        .status(200)
        .send({ message: `Agreement was deleted successfuly!` });
    }
  } catch (exception) {
    return next(exception);
  }
};
