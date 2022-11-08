import express from "express";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { isWorker } from "../utils/authJwt";
import {
  createRentalWorkModel,
  getRentalWorkModel,
  updateCustomerContract,
} from "../middleware/rentalWorkModelMiddleware";
const rentalWorkModelRouter = express.Router();

rentalWorkModelRouter.post("/create", tokenAuthentication, createRentalWorkModel);

rentalWorkModelRouter.put("/update/customerContract", tokenAuthentication, isWorker, updateCustomerContract);

rentalWorkModelRouter.post("/model", tokenAuthentication, getRentalWorkModel);

export default rentalWorkModelRouter;
