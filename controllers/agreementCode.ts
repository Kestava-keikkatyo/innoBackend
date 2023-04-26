import express from "express";
import {
  postAgreement,
} from "../middleware/agreementMiddleware";
import {
  findAgreementCode,
  deleteAgreementCode,
  addAgreementCodes,
  getAgreementCodesByCreator,
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

export default agreementCodeRouter;