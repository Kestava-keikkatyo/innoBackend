import { Request, Response, NextFunction } from "express";
import File from "../models/File";

export async function addFile(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, creator, fileType, file } = req.body;
    const newFile = new File({ title, description, creator, fileType, file });
    const savedFile = await newFile.save();
    res.status(201).json(savedFile);
  } catch (exception) {
    return next(exception);
  }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = req.params.id;
    const userId = res.locals.userId;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the creator of this file" });
    }

    await File.findByIdAndDelete(fileId);
    res.status(200).json({ message: "File deleted" });
  } catch (exception) {
    return next(exception);
  }
}

export async function getFilesByCreator(req: Request, res: Response, next: NextFunction) {
  try {
    const creator = req.params.creator;
    const files = await File.find({ creator }, { file: 0 });
    res.status(200).json(files);
  } catch (exception) {
    return next(exception);
  }
}

export async function getFileById(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);
    res.status(200).json(file);
  } catch (exception) {
    return next(exception);
  }
}
