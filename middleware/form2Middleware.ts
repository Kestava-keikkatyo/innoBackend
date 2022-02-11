import { NextFunction, Request, Response } from "express";
import { CallbackError } from "mongoose";
import Form2 from "../models/Form2";
import { IForm2Document } from "../objecttypes/modelTypes";

/**
 * Post a new form to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New form document
 */
export const postForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  try {
    const formDocument: IForm2Document = new Form2({
      user: res.locals.decoded.id,
      title: body.title,
      isPublic: body.isPublic,
      filled: body.filled,
      common: body.common,
      questions: body.questions,
      description: body.description,
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
export const getMyForms = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    Form2.find(
      { user: res.locals.decoded.id },
      (error: CallbackError, docs: IForm2Document[]) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }
        if (!docs.length) {
          return res.status(404).json({ message: "No forms found!" });
        }
        return res.status(200).json(docs);
      }
    );
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
export const getFormByCommon = (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
  try {
    Form2.find({common: true, filled: false}, (error: CallbackError, doc: IForm2Document | null) => {
      if (error) {
        return res.status(500).json({message: error.message});
      }
      if (!doc) {
        return res.status(404).send({message: `No form found!`});
      }
      return res.status(200).send(doc);
    });
  }catch(exception){
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
export const getFormById = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = req;
  const id: string = params.id;

  try {
    Form2.findById(id, (error: CallbackError, doc: IForm2Document | null) => {
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
export const updateForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params, body } = req;
  const { id } = params;

  try {
    const form: IForm2Document | null = await Form2.findByIdAndUpdate(
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