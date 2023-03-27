import express from "express";
import {
  postAgreement,
} from "../middleware/agreementMiddleware";
import {
  findAgreementCode,
  deleteAgreementCode,
  addAgreementCode,
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
  "/addCode",
  tokenAuthentication,
  isAgency,
  addAgreementCode
);