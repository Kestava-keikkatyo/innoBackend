/** Express router providing Agency-related routes
 * @module controllers/admin
 * @requires express
 */

/**
 * Express router to mount Agency-related functions on.
 * @type {object}
 * @const
 * @namespace adminRouter
*/
import express, { NextFunction, Request, Response } from 'express'
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import { IAdmin, IAdminDocument, IAgency, IAgencyDocument, IBusiness, IBusinessDocument, IWorker, IWorkerDocument } from "../objecttypes/modelTypes";
import { needsToBeAdmin } from '../utils/middleware';
import Admin from '../models/Admin'
import Business from '../models/Business'
import authenticateToken from '../utils/auhenticateToken';
//import BusinessContract from '../models/BusinessContract';

const adminRouter = express.Router()


/**
 * @openapi
 * /{userType}/{userId}:
 *   delete:
 *     summary: Route for deleting a user
 *     description: Deletes any type of user if it qualifies for deletion (= doesn't have restricting contracts/forms/etc)
 *     tags: [Agency, Worker, Business, Admin]
 *     responses:
 *       "200":
 *         description: User was deleted
 *       "304":
 *         description: User couldn't be deleted due to restrictions etc.
 * 
 */
adminRouter.delete("/:userType/:userId", authenticateToken, needsToBeAdmin, async (req: Request<{userType: string, userId: string}, unknown, IAgency | IWorker | IBusiness | IAdmin>, res: Response, next: NextFunction) => {
  const { params } = req
  const { userType, userId } = params

  try {
    let user : IAgencyDocument | IWorkerDocument | IBusinessDocument | IAdminDocument | null = null;
    switch (userType.toLowerCase()) {
      case 'worker':
        user = await Worker.findOneAndDelete({_id: userId, workContracts: {$eq: []}, businessContracts: {$eq: []} });
        break;
      case 'business':
        user = await Business.findOneAndDelete({_id: userId, workContracts: {$eq: []}, businessContracts: {$eq: []}, forms: {$eq: []} });
        break;
      case 'agency':
        user = await Agency.findOneAndDelete({_id: userId, workContracts: {$eq: []}, businessContracts: {$eq: []}, forms: {$eq: []} });
        break;
      case 'admin':
        user = await Admin.findOneAndDelete({_id: userId });
        break;
    }

    if (user) {
      console.log(`${userType} ${user.name} was deleted.`);

    }

    return res
      .status(user ? 200 : 404)
      .send()

  } catch (exception) {
    return next(exception)
  }
})

export default adminRouter
