import { NextFunction, Request, Response } from "express";
import { IRentalWorkModelDocument } from "../objecttypes/modelTypes";
import RentalWorkModel from "../models/RentalWorkModel";
import { CallbackError } from "mongoose";

export const createRentalWorkModel = async (_req: Request, res: Response, next: Function) => {
  console.log(`Creating rental work model for user with id of ${res.locals.userId}`);
  try {
    const rentalWorkModel: IRentalWorkModelDocument = new RentalWorkModel({
      worker: res.locals.userId,
    });
    const rwmValidationError = rentalWorkModel.validateSync();
    if (rwmValidationError) {
      return res.status(400).json({ message: rwmValidationError.message });
    }

    rentalWorkModel.save(async (error: CallbackError, rwm: IRentalWorkModelDocument) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!rwm) {
        return res.status(500).json({ message: "Unable to save rental work model document" });
      }
      return rwm;
    });

    return res.status(200).send({
      rentalWorkModel: {
        contractOfEmployment: rentalWorkModel.contractOfEmployment,
        customerContract: rentalWorkModel.customerContract,
        feedbackEvaluation: rentalWorkModel.feedbackEvaluation,
        guidanceToWork: rentalWorkModel.guidanceToWork,
        orderingEmployee: rentalWorkModel.orderingEmployee,
        workPerformance: rentalWorkModel.workPerformance,
      },
    });
  } catch (exception) {
    return next(exception);
  }
};

export const updateCustomerContract = async (
  req: Request<{ userId: string }, { step: number; value: boolean }>,
  res: Response,
  next: NextFunction
) => {
  const updatableSteps = ["responsibilities", "forms", "good_practices"];
  const toBeUpdated = updatableSteps[req.body.step];
  const value = req.body.checked;
  console.log(`Updating customer contract step "${toBeUpdated}" to be ${value} for user with id ${res.locals.userId}`);
  try {
    let rentalWorkModel: IRentalWorkModelDocument | null = null;

    switch (toBeUpdated) {
      case "responsibilities":
        rentalWorkModel = await RentalWorkModel.findOneAndUpdate(
          { worker: res.locals.userId },
          { $set: { "customerContract.responsibilities": value } },
          { runValidators: true }
        );
        break;
      case "forms":
        rentalWorkModel = await RentalWorkModel.findOneAndUpdate(
          { worker: res.locals.userId },
          { $set: { "customerContract.forms": value } },
          { runValidators: true }
        );
        break;
      case "good_practices":
        rentalWorkModel = await RentalWorkModel.findOneAndUpdate(
          { worker: res.locals.userId },
          { $set: { "customerContract.good_practices": value } },
          { runValidators: true }
        );
        break;
      default:
        console.log(`Type ${toBeUpdated} not found...`);
    }

    if (rentalWorkModel) {
      console.log(`RENTAL WORK MODEL with id ${rentalWorkModel._id} was updated!`);
    }
    return res.status(rentalWorkModel ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

export const getRentalWorkModel = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rentalWorkModel: IRentalWorkModelDocument | null = await RentalWorkModel.findOne({
      worker: res.locals.userId,
    });
    if (!rentalWorkModel) {
      return res.status(401).json({ message: "Rental work model not found" });
    }
    return res.status(200).send({
      rentalWorkModel: {
        contractOfEmployment: rentalWorkModel.contractOfEmployment,
        customerContract: rentalWorkModel.customerContract,
        feedbackEvaluation: rentalWorkModel.feedbackEvaluation,
        guidanceToWork: rentalWorkModel.guidanceToWork,
        orderingEmployee: rentalWorkModel.orderingEmployee,
        workPerformance: rentalWorkModel.workPerformance,
      },
    });
  } catch (exception) {
    return next(exception);
  }
};
