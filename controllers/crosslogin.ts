import express from "express";
import authenticateToken from "../utils/auhenticateToken";
import {
  getLogin,
} from "../middleware/crossloginmiddleware";

const crossloginRouter = express.Router();
crossloginRouter.get('/',authenticateToken,getLogin);
export default crossloginRouter;
