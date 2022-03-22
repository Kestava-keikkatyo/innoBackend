import { NextFunction, Request, Response } from "express";
/**
 * Post a new feedback to database.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New feedback document
 */
export const getLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req;
  console.log(res.locals.decoded.id,body)
    try {
        res.send('h')
    }
    catch (exception) {
     return next(exception);
   }


}
export default {};
