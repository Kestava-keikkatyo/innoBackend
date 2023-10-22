import { Request, Response, NextFunction } from "express";
import AgreementCode from "../models/AgreementCode";
import { IAgreementCode } from "../objecttypes/modelTypes";

/**
 * Find an agreement code in the database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updates res.locals with agreementCodeFound and creator properties
 */
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

    next();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Delete an agreement code from the database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted agreement code document
 */
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

/**
 * Add multiple new agreement codes to the database and return them.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Array of new agreement code documents
 */
export const addAgreementCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const numberOfCodes = req.body.numberOfCodes;
    const maxAllowedCodesPerUser = 500;

    if (!numberOfCodes || numberOfCodes < 1 || numberOfCodes > 100) {
      return res.status(400).json({ message: "Number of agreement codes should be between 1 and 100" });
    }

    const userId = res.locals.userId;

    // Count the number of agreement codes created by the user
    const userCodeCount = await AgreementCode.countDocuments({ creator: userId });

    // Calculate the number of codes that can be created without exceeding the limit
    const remainingCodes = maxAllowedCodesPerUser - userCodeCount;
    const codesToCreate = Math.min(numberOfCodes, remainingCodes);

    if (codesToCreate <= 0) {
      return res.status(400).json({
        message: "Maximum allowed number of agreement codes per user (" + maxAllowedCodesPerUser + ") has been reached",
      });
    }

    const newAgreementCodes = [];

    for (let i = 0; i < codesToCreate; i++) {
      const code = generateRandomCode(5);

      const agreementCode = new AgreementCode({
        code: code,
        createdAt: new Date(),
        creator: userId,
      });

      const savedAgreementCode = await agreementCode.save();

      if (!savedAgreementCode) {
        return res.status(400).json({ message: "Failed to create agreement code" });
      }

      newAgreementCodes.push(savedAgreementCode);
    }

    res.status(200).json({ message: "Agreement codes added successfully", agreementCodes: newAgreementCodes });
  } catch (exception) {
    return next(exception);
  }
};

/**

Generate a random alphanumerical code with the specified length.
@param {number} length - Length of the generated code.
@returns Random alphanumerical code
*/
function generateRandomCode(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

/**
 * Retrieve all agreement codes created by a user.
 * @param {Request} _req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Agreement code documents created by the user
 */
export const getAgreementCodesByCreator = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the user ID from res.locals
    const userId = res.locals.userId;

    // Check if the user ID is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Retrieve all agreement codes created by the user
    const agreementCodes: IAgreementCode[] = await AgreementCode.find({ creator: userId });

    // Return the found agreement codes
    res.status(200).json({ agreementCodes });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Update the marked value of an agreement code in the database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated agreement code document
 */
export const updateMarkedValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.body.id;
    const marked = req.body.marked;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    if (typeof marked === "undefined") {
      return res.status(400).json({ message: "Marked value is required" });
    }

    if (typeof marked !== "boolean") {
      return res.status(400).json({ message: "Marked value must be a boolean" });
    }

    const updatedAgreementCode = await AgreementCode.findByIdAndUpdate(id, { marked }, { new: true });

    if (!updatedAgreementCode) {
      return res.status(404).json({ message: "Agreement code not found" });
    }

    res.status(200).json({ message: "Agreement code marked value updated successfully", updatedAgreementCode });
  } catch (exception) {
    return next(exception);
  }
};
