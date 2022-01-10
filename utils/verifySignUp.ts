import User from "../models/User";
import { NextFunction, Request, Response } from "express";

export const checkDuplicateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  User.findOne({
    email: req.body.email,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (user) {
      res
        .status(409)
        .json({ message: `Failed! ${req.body.email} is already registered!` });
      return;
    }
    next();
  });
};
