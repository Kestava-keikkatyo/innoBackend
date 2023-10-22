import express from "express";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { addFile, deleteFile, getFilesByCreator, getFileById } from "../middleware/fileMiddleware";

const fileRouter = express.Router();

fileRouter.post("/", tokenAuthentication, addFile);

fileRouter.delete("/:id", tokenAuthentication, deleteFile);

fileRouter.get("/creator", tokenAuthentication, getFilesByCreator);

fileRouter.get("/:id", tokenAuthentication, getFileById);

export default fileRouter;
