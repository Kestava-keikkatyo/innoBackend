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
import rateLimit from "express-rate-limit";

const agreementCodeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // Time window in milliseconds (e.g., 24 hours)
  max: 50, // Maximum number of requests allowed in the time window
  message: "Code generation limit reached" // Custom error message
});
const agreementCodeRouter = express.Router();

agreementCodeRouter.post(
  "/createAgreement",
  tokenAuthentication,
  agreementCodeLimiter,
  isWorkerOrBusiness,
  findAgreementCode,
  postAgreement,
  deleteAgreementCode
);

agreementCodeRouter.post(
  "/addCode",
  tokenAuthentication,
  agreementCodeLimiter,
  isAgency,
  addAgreementCode
);

export default agreementCodeRouter;