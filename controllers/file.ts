import express from "express";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import { addFile, deleteFile, getFilesByCreator, getFilesById, getFileById } from "../middleware/fileMiddleware";

const fileRouter = express.Router();

fileRouter.post("/", tokenAuthentication, addFile);

fileRouter.delete("/:id", tokenAuthentication, deleteFile);

fileRouter.get("/creator", tokenAuthentication, getFilesByCreator);

fileRouter.get("/worker/:id", tokenAuthentication, getFilesById);

fileRouter.get("/:id", tokenAuthentication, getFileById);

export default fileRouter;
