import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import User from "../models/User";
import { IUser, IUserDocument } from "../objecttypes/modelTypes";
import { hash } from "bcryptjs";

/**
 * This function is used to post a new user to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New user document
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const passwordLength: number = body.password ? body.password.length : 0;
    if (passwordLength < 3) {
      return res
        .status(400)
        .json({ message: "Password length less than 3 characters" });
    }
    const saltRounds: number = 10;
    const passwordHash: string = await hash(body.password, saltRounds);
    const userDocument: IUserDocument = new User({
      name: body.name,
      email: body.email,
      userType: body.userType,
      passwordHash,
    });
    const user = await userDocument.save();
    if (!user) {
      return res.status(400).send({ error: "Failed to create a user!" });
    }
    return res.status(200).send(user);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get all users.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All users
 */
export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users: Array<IUserDocument> | null = await User.find({});
    if (users) {
      return res.status(200).json(users);
    }
    return res.status(404).json({ message: "No users found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get user by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns User
 */
export const getUserById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    User.findById(id, (error: CallbackError, doc: IUserDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res
          .status(404)
          .send({ message: `No user with ID ${id} found!` });
      }
      return res.status(200).send(doc);
    });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get all users of type Worker.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns workers
 */
export const getAllWorkers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workers: Array<IUserDocument> | null = await User.find({
      userType: "Worker",
    });
    if (workers) {
      return res.status(200).json(workers);
    }
    return res.status(404).json({ message: "No workers found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get all users of type Business.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns businesses
 */
export const getAllBusinesses = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const businesses: Array<IUserDocument> | null = await User.find({
      userType: "Business",
    });
    if (businesses) {
      return res.status(200).json(businesses);
    }
    return res.status(404).json({ message: "No businesses found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get all users of type Agency.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns agencies
 */
export const getAllAgencies = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const agencies: Array<IUserDocument> | null = await User.find({
      userType: "Agency",
    });
    if (agencies) {
      return res.status(200).json(agencies);
    }
    return res.status(404).json({ message: "No agencies found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get all users of type Admin.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns admins
 */
export const getAllAdmins = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins: Array<IUserDocument> | null = await User.find({
      userType: "Admin",
    });
    if (admins) {
      return res.status(200).json(admins);
    }
    return res.status(404).json({ message: "No admins found!" });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to update user type by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated user
 */
export const updateUser = async (
  req: Request<{ userId: string }, IUser>,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { userId } = params;
  const { userType } = body;

  try {
    const user: IUserDocument | null = await User.findByIdAndUpdate(
      { _id: userId },
      { userType },
      { new: true, runValidators: true, lean: true }
    );
    if (user) {
      console.log(`USER with id ${user._id} was updated!`);
    }
    return res.status(user ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to update user status by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated user status
 */
export const updateUserStatus = async (
  req: Request<{ userId: string }, IUser>,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { userId } = params;
  const { active } = body;

  try {
    const user: IUserDocument | null = await User.findByIdAndUpdate(
      { _id: userId },
      { active },
      { new: true, runValidators: true, lean: true }
    );
    if (user) {
      console.log(`USER with id ${user._id} was deactivated!`);
    }
    return res.status(user ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to update user profile by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated user profile
 */
export const updateUserProfile = async (
  req: Request<{ userId: string }, IUser>,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { userId } = params;

  try {
    const user: IUserDocument | null = await User.findByIdAndUpdate(
      { _id: userId },
      { ...body },
      { new: true, runValidators: true, lean: true }
    );
    if (user) {
      console.log(`USER with id ${user._id} updated!`);
    }
    return res.status(user ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to delete user by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted user
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const { userId } = params;

  try {
    const user: IUserDocument | null = await User.findByIdAndDelete({
      _id: userId,
    });

    if (!user) {
      return res
        .status(404)
        .send({ message: `User with ID ${userId}  is not existing!` });
    } else {
      return res
        .status(200)
        .send({ message: `User with ${user._id} was deleted successfuly!` });
    }
  } catch (exception) {
    return next(exception);
  }
};