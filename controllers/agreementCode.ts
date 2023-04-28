import express from "express";
import {
  postAgreement,
} from "../middleware/agreementMiddleware";
import {
  findAgreementCode,
  deleteAgreementCode,
  addAgreementCodes,
  getAgreementCodesByCreator,
  updateMarkedValue,
} from "../middleware/agreementCodeMiddleware";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import {
  isAgency,
  isWorkerOrBusiness,
} from "../utils/authJwt";

const agreementCodeRouter = express.Router();

agreementCodeRouter.post(
  "/createAgreement",
  tokenAuthentication,
  isWorkerOrBusiness,
  findAgreementCode,
  postAgreement,
  deleteAgreementCode
);

agreementCodeRouter.post(
  "/addCodes",
  tokenAuthentication,
  isAgency,
  addAgreementCodes
);

agreementCodeRouter.get(
  "/getAgreementCodesByCreator",
  tokenAuthentication,
  isAgency,
  getAgreementCodesByCreator
);

agreementCodeRouter.put(
  "/updateMarkedValue",
  tokenAuthentication,
  isAgency,
  updateMarkedValue
);

export default agreementCodeRouter;