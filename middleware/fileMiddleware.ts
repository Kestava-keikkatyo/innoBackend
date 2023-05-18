import { Request, Response, NextFunction } from 'express';
import multer, { diskStorage } from 'multer';
import fs from 'fs';
import path from 'path';
import File from "../models/File";

// Create 'uploads' directory if it doesn't exist
const dir = './uploads';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Extend the Express Request interface to include Multer's file property
interface MulterRequest extends Request {
  file?: Express.Multer.File; // Notice the '?' making 'file' optional
}

const storage = diskStorage({
  destination: function (_, __, cb) {  // _ represents unused req, __ represents unused file
    cb(null, 'uploads/');
  },
  filename: function (_, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

export async function addFile(req: MulterRequest, res: Response, next: NextFunction) {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof Error) {
      return next(err);
    }

    const { title, description, creator } = req.body;
    const file = req.file;

    if (!file) {
      return next(new Error("File upload failed"));
    }

    try {
      const fileData = fs.readFileSync(file.path);

      const newFile = new File({
        title,
        description,
        creator,
        uploadDate: new Date(), // Set the upload date to the current time
        file: {
          data: fileData,
          contentType: file.mimetype,
        },
      });

      const savedFile = await newFile.save();

      // Delete the file from disk
      fs.unlinkSync(file.path);

      res.status(201).json(savedFile);
    } catch (exception) {
      return next(exception);
    }
  });
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

export async function getFilesByCreator(_req: Request, res: Response, next: NextFunction) {
  try {
    const creator = res.locals.userId;
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
