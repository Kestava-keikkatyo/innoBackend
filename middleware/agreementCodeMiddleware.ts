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
    res.locals.creator = agreementCode.creator;

    next()
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
    res.status(200).json({ message: "Agreement created and agreement code deleted successfully" });
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
      code: code,
      createdAt: new Date(),
      creator: req.body.userId
    });

    const savedAgreementCode = await agreementCode.save();

    if (!savedAgreementCode) {
      return res.status(400).json({ message: "Failed to create agreement code" });
    }

    res.status(200).json({ message: "Agreement code added successfully" });
  } catch (exception) {
    return next(exception);
  }
}