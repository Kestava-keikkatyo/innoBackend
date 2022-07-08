import { NextFunction, Request, Response } from "express";
import TokenService from "../services/TokenService";

export const tokenAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  const token: string = req.headers["x-access-token"] as string;
  if (token) {
    try {
      const userId = await TokenService.verify(token);
      res.locals.userId = userId;

      if (userId) return next();
    } catch (err) {
      return res.status(500).send({ message: "Failed to authenticate token." });
    }
  }

  return res.status(401).send();
};
