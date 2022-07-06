import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Form from "../models/Form";
import { IFormDocument } from "../objecttypes/modelTypes";
import { copyProperties } from "../utils/common";

const updatableFields = ["title", "isPublic", "filled", "common", "questions", "description"];

/**
 * Post a new form to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New form document
 */
export const postForm = async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  console.log(body.questions);

  try {
    const formDocument: IFormDocument = new Form({
      user: res.locals.userId,
      ...copyProperties(body, updatableFields),
    });
    const form = await formDocument.save();
    if (!form) {
      return res.status(400).send({ error: "Failed to create form!" });
    }
    return res.status(200).send(form);
  } catch (exception) {
    return next(exception);
  }
};

/**
 * This function is used to get own forms.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Agency's or Business's form
 */
export const getMyForms = (_req: Request, res: Response, next: NextFunction) => {
  try {
    Form.find({ user: res.locals.userId }, (error: CallbackError, docs: IFormDocument[]) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!docs.length) {
        return res.status(404).json({ message: "No forms found!" });
      }
      return res.status(200).json(docs);
    });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get form by common.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Forms
 */
export const getFormByCommon = (req: Request, res: Response, next: NextFunction) => {
  try {
    Form.find({ common: true, filled: false }, (error: CallbackError, doc: IFormDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No form found!` });
      }
      return res.status(200).send(doc);
    })
      .skip(Number(req.query.page) * 10)
      .limit(Number(req.query.limit))
      .exec()
      .then()
      .catch((err) => {
        console.error(err);
      });
  } catch (exception) {
    return next(exception);
  }
};

export const getFormByPublic = (req: Request, res: Response, next: NextFunction) => {
  try {
    Form.find({ isPublic: true, common: false, filled: false }, (error: CallbackError, doc: IFormDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No form found!` });
      }
      return res.status(200).send(doc);
    })
      .skip(Number(req.query.page) * 10)
      .limit(Number(req.query.limit))
      .exec()
      .then()
      .catch((err) => {
        console.error(err);
      });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get form by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Form
 */
export const getFormById = (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Form.findById(id, (error: CallbackError, doc: IFormDocument | null) => {
      if (error) {
        return res.status(500).json({ message: error.message });
      }
      if (!doc) {
        return res.status(404).send({ message: `No form found!` });
      }
      return res.status(200).send(doc);
    });
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Update form by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated form
 */
export const updateForm = async (req: Request, res: Response, next: NextFunction) => {
  const { params, body } = req;
  const { id } = params;

  try {
    const form: IFormDocument | null = await Form.findByIdAndUpdate(
      { _id: id },
      { ...body },
      { new: true, runValidators: true, lean: true }
    );
    if (form) {
      console.log(`Form was updated!`);
    }
    return res.status(form ? 200 : 404).send();
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Delete form by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Deleted form
 */
export const deleteForm = async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req;
  const id: string = params.id;

  try {
    const form: IFormDocument | null = await Form.findByIdAndDelete(id);

    if (!form) {
      return res.status(404).send({ message: `Form by id: ` + id + ` is not existing!` });
    } else {
      return res.status(200).send({ message: `Form was deleted successfully!` });
    }
  } catch (exception) {
    return next(exception);
  }
};

/**
 * Get all public forms.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Public forms
 */
export const getPublicForms = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const forms: Array<IFormDocument> | null = await Form.find({
      isPublic: true,
      filled: false,
    });
    if (forms) {
      return res.status(200).json(forms);
    }
    return res.status(404).json({ message: "No public forms found!" });
  } catch (exception) {
    return next(exception);
  }
};
