import { NextFunction, Request, Response } from "express";
import TokenService from "../services/TokenService";
import { IAgency, IBusiness, IUserDocument, IWorker, userType } from "../objecttypes/modelTypes";
import bcrypt, { hash } from "bcryptjs";
import User, { Agency, Business, Worker } from "../models/User";
import { CallbackError } from "mongoose";
import { IBodyLogin } from "../objecttypes/otherTypes";

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

export const register = async (
  req: Request<unknown, unknown, IWorker | IAgency | IBusiness>,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;

  try {
    const passwordLength = body.password ? body.password.length : 0;
    if (passwordLength < 8) {
      return res.status(400).json({ message: "Password length less than 8 characters" });
    }

    if (!Object.values(userType).includes(body.userType)) {
      return res.status(400).json({ message: "Unknown user type" });
    }

    const user: IUserDocument = await createUser(body);

    const validationError = user.validateSync();
    if (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    return user.save(async (error: CallbackError, user: IUserDocument) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!user) {
        return res.status(500).json({ message: "Unable to save user document" });
      }
      const token: string = await TokenService.createToken(user);
      return res.status(200).send({
        token,
        name: user.name,
        email: user.email,
        role: user.userType.toLowerCase(),
        _id: user.id,
      });
    });
  } catch (exception) {
    return next(exception);
  }
};

export const signIn = async (req: Request<unknown, unknown, IBodyLogin>, res: Response) => {
  const { body } = req;

  const user: IUserDocument | null = await User.findOne({
    email: body.email,
  });
  const passwordCorrect: boolean =
    user === null ? false : await bcrypt.compare(body.password, user.passwordHash as string);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.active) {
    const token: string = await TokenService.createToken(user);

    return res.status(200).send({
      token,
      name: user.name,
      email: user.email,
      role: user.userType.toLowerCase(),
      _id: user.id,
    });
  } else {
    return res.status(403).json({
      message: "This account has been blocked for security reasons",
    });
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  try {
    const user: IUserDocument | null = await User.findById(res.locals.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const currentPasswordCorrect: boolean = await bcrypt.compare(body.currentPassword, user.passwordHash as string);

    if (!currentPasswordCorrect) {
      return res.status(401).json({ message: "The current password is incorrect" });
    }
    if (body.currentPassword === body.newPassword) {
      return res.status(406).json({
        message: "The new password can not be as same as the current password",
      });
    }
    if (!body.newPassword) {
      return res.status(400).json({ message: "The new password can't be blank" });
    }
    const passwordLength: number = body.newPassword.length;
    if (passwordLength < 8) {
      return res.status(411).json({ message: "password length less than 8 characters" });
    }
    const saltRounds: number = 10;
    const newPasswordHash = await hash(body.newPassword, saltRounds);

    const updatePasswordField = {
      passwordHash: newPasswordHash,
    };
    await user.update(updatePasswordField);
    await user.save();

    return res.status(200).send();
  } catch (exception) {
    return next(exception);
  }
};

export const logout = async (req: Request, res: Response) => {
  const token: string = req.headers["x-access-token"] as string;
  if (token) {
    await TokenService.deleteToken(token);
  }
  return res.status(200).send();
};

async function createUser(body: IWorker | IAgency | IBusiness) {
  const saltRounds: number = 10;
  const passwordHash: string = await hash(body.password, saltRounds);

  switch (body.userType) {
    case userType.Worker:
      return new Worker({
        name: body.name,
        email: body.email,
        passwordHash,
      });
    case userType.Agency:
      return new Agency({
        name: body.name,
        email: body.email,
        category: "category" in body ? body.category : "",
        passwordHash,
      });
    case userType.Business:
      return new Business({
        name: body.name,
        email: body.email,
        category: "category" in body ? body.category : "",
        passwordHash,
      });
    default:
      throw new Error("User type is not defined");
  }
}
