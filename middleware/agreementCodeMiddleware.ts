import { Request, Response, NextFunction } from "express";
import AgreementCode from "../models/AgreementCode";
import { IAgreementCode } from "../objecttypes/modelTypes";

export const findAgreementCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.body.code;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const agreementCode: IAgreementCode | null = await AgreementCode.findOne({ code });

    if (!agreementCode) {
      return res.status(404).json({ message: "Agreement code not found" });
    }

    res.locals.agreementCodeFound = true;
  } catch (exception) {
    return next(exception);
  }
};

export const deleteAgreementCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.body.code;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const deletedAgreementCode = await AgreementCode.findOneAndDelete({ code });

    if (!deletedAgreementCode) {
      return res.status(404).json({ message: "Agreement code not found" });
    }

    res.locals.deletedAgreementCode = deletedAgreementCode;
  } catch (exception) {
    return next(exception);
  }
};

export const addAgreementCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.body.code;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const agreementCode = new AgreementCode({
      code,
      createdAt: new Date(),
      creator: req.body.user._id
    });

    const savedAgreementCode = await agreementCode.save();

    if (!savedAgreementCode) {
      return res.status(400).json({ message: "Failed to create agreement code" });
    }

    res.locals.savedAgreementCode = savedAgreementCode;
  } catch (exception) {
    return next(exception);
  }
}