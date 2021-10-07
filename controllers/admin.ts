/** Express router providing Admin-related routes
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
import { IAdmin, IAdminDocument, IAgency, IAgencyDocument, IBusiness, IBusinessDocument, IBusinessContractDocument, INotificationsDocument,IProfile, IProfileDocument, IWorker, IWorkerDocument } from "../objecttypes/modelTypes";
import { needsToBeAdmin } from '../utils/middleware';
import Admin from '../models/Admin'
import Business from '../models/Business'
import authenticateToken from '../utils/auhenticateToken';
//import BusinessContract from '../models/BusinessContract';
import { hash } from "bcryptjs"
//import { sign } from "jsonwebtoken"
import Notifications from '../models/Notifications';
import Profile from '../models/Profile';
import { addProfileToAgencyBusinessOrWorker } from './profile';
import BusinessContract from '../models/BusinessContract';

const adminRouter = express.Router()


/**
 * @openapi
 * /{userType}/{userId}:
 *   post:
 *     summary: Route for creating a user
 *     description: Creates any type of user and initialises related information like notifications
 *     tags: [Agency, Worker, Business, Admin]
 *     responses:
 *       "200":
 *         description: User was created
 *       "400":
 *         description: User couldn't be created due to restrictions etc.
 * 
 */
 adminRouter.post("/:userType", authenticateToken, needsToBeAdmin, async (req: Request<{userType: string, userId: string}, unknown, IAgency | IWorker | IBusiness | IAdmin>, res: Response, next: NextFunction) => {
  const { params, body } = req
  const { userType } = params

  try {

    const passwordLength: number = body.password ? body.password.length : 0
    if (passwordLength < 3) {
      return res.status(400).json({ message: "Password length less than 3 characters" })
    }
    const saltRounds: number = 10
    const passwordHash: string = await hash(body.password, saltRounds)

    let user : IAgencyDocument | IWorkerDocument | IBusinessDocument | IAdminDocument | null = null;
    switch (userType.toLowerCase()) {
      case 'worker':
        try {
          const workerToCreate: IWorkerDocument = new Worker({
            name: body.name,
            email: body.email,
            passwordHash,
          })
          user = await workerToCreate.save() //TODO use callback and check for errors
        } catch (exception) {
          return next(exception)
        }
        
        break;
      case 'business':
        try {
          const businessToCreate: IBusinessDocument = new Business({
            name: body.name,
            email: body.email,
            passwordHash,
          })
          user = await businessToCreate.save() //TODO use callback and check for errors
        } catch (exception) {
          return next(exception)
        }
        break;
      case 'agency':
        try {
          const agencyToCreate: IAgencyDocument = new Agency({
            name: body.name,
            email: body.email,
            passwordHash,
          })
          user = await agencyToCreate.save() //TODO use callback and check for errors

          // Create business contracts for the new user (Agency)
          const businessContractDocument: IBusinessContractDocument = new BusinessContract({
            userId: user._id,
            receivedContracts: {
              businesses: [],
              workers: [],
            },
            pendingContracts:{
              businesses: [],
              workers: []
            },
            madeContracts: {
              buinesses: [],
              workers: []
            },
            requestContracts: {
              businesses: [],
              workers: []
            }
          })
          const businessContracts = await businessContractDocument.save();
          if (businessContracts) {
            user = await Agency.findOneAndUpdate(
              { _id: user._id },
              { $addToSet: { businessContracts: businessContracts._id } })
          }
        } catch (exception) {
          return next(exception)
        }
        break;
      case 'admin':
        try {
          const adminToCreate: IAdminDocument = new Admin({
            name: body.name,
            email: body.email,
            passwordHash,
          })
          user = await adminToCreate.save() //TODO use callback and check for errors
        } catch (exception) {
          return next(exception)
        }
        break;
    }

    if (!user) return res.status(400).send({error: "Couldn't create a user"});

    // Create notification for the new user
    const notificationDocument: INotificationsDocument = new Notifications({
      userId: user._id,
      unread_messages: [],
      read_messages: []
    })

    await notificationDocument.save();

    // Create profile for the new user
    const newprofile: IProfileDocument = new Profile({
      name: body.name,
      email: body.email
    })

    const profileResult = await newprofile.save();

    return addProfileToAgencyBusinessOrWorker(user.userType, user._id, profileResult, res, next);

    
    

  } catch (exception) {
    return next(exception)
  }
})

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

adminRouter.patch("/:userType/:userId", authenticateToken, needsToBeAdmin, async (req: Request<{userType: string, userId: string}, IAgency | IWorker | IBusiness | IAdmin>, res: Response, next: NextFunction) => {
  const { params, body } = req
  const { userType, userId } = params
  const { active } = body
  
  try {

    let user : IAgencyDocument | IWorkerDocument | IBusinessDocument | IAdminDocument | null = null;
    switch (userType.toLowerCase()) {
      case 'worker':
        user = await Worker.findByIdAndUpdate({_id: userId}, { active }, { new: true, runValidators: true });
        break;
      case 'business':
        user = await Business.findByIdAndUpdate({_id: userId}, { active }, { new: true, runValidators: true });
        break;
      case 'agency':
        user = await Agency.findByIdAndUpdate({_id: userId}, { active }, { new: true, runValidators: true });
        break;
      case 'admin':
        user = await Admin.findByIdAndUpdate({_id: userId}, { active }, { new: true, runValidators: true });
        break;
    }
  
      
    if (user) {
      console.log(`${userType} ${user.name} was deactivated.`);

    }

    return res
      .status(user ? 200 : 404)
      .send()

  } catch (exception) {
    return next(exception)
  }
})

adminRouter.put("/:userType/:userId", authenticateToken, needsToBeAdmin, async (req: Request<{userType: string, userId: string}, unknown, IAgency | IWorker | IBusiness | IAdmin>, res: Response, next: NextFunction) => {
  const { params } = req
  const { userType, userId } = params

  /*const updates = Object.keys(req.body)
  const allowedUpdates = ['name' , 'email', 'password']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' })
  }*/

  try {
    let user : IAgencyDocument | IWorkerDocument | IBusinessDocument | IAdminDocument | null = null;
    switch (userType.toLowerCase()) {
      case 'worker':
        user = await Worker.findByIdAndUpdate({_id: userId}, req.body, { new: true, runValidators: true });
        break;
      case 'business':
        user = await Business.findByIdAndUpdate({_id: userId}, req.body, { new: true, runValidators: true });
        break;
      case 'agency':
        user = await Agency.findByIdAndUpdate({_id: userId}, req.body, { new: true, runValidators: true });
        break;
      case 'admin':
        user = await Admin.findByIdAndUpdate({_id: userId}, req.body, { new: true, runValidators: true });
        break;
    }

    
    if (user) {
      console.log(`${userType} ${user.name} was updated`);

    }

    return res
      .status(user ? 200 : 404)
      .send()

  } catch (exception) {
    return next(exception)
  }
})

adminRouter.put("/:profileId", authenticateToken, needsToBeAdmin, async (req: Request<{profileId: string}, unknown, IProfile>, res: Response, next: NextFunction) => {
  const { params } = req
  const { profileId } = params
  
  try {
    let profile : IProfileDocument | null = null;
    profile = await Profile.findByIdAndUpdate({_id: profileId}, req.body, { new: true, runValidators: true });
    
    if (profile) {
      console.log(`${profileId} was updated`);

    }

    return res
      .status(profile ? 200 : 404)
      .send()

  } catch (exception) {
    return next(exception)
  }
})



export default adminRouter