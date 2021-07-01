import express, { NextFunction, Request, Response } from "express"
import { IProfileDocument } from "../objecttypes/modelTypes"
import authenticateToken from "../utils/auhenticateToken"
import { needsToBeAgencyBusinessOrWorker } from "../utils/middleware"
import Profile from "../models/Profile"
import { IBaseBody, IBodyWithProfile } from "../objecttypes/otherTypes"
import { CallbackError, DocumentDefinition } from "mongoose"
import {IAgencyDocument, IBusinessDocument, IWorkerDocument} from "../objecttypes/modelTypes"

import { error as _error, info as _info } from "../utils/logger"

import Business from "../models/Business"
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import { ParamsDictionary } from "express-serve-static-core"




const profileRouter = express.Router()


profileRouter.post("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<unknown, unknown, IBodyWithProfile>, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    // profile validation and checking happens in schema itself
    const newprofile: IProfileDocument = new Profile({
      cover: body.cover,
      profilePicture: body.profilePicture,
      userInformation: body.userInformation,
      contactInformation: body.contactInformation,
      video: body.video,
      instructions: body.instructions
    })

    newprofile.save((error: CallbackError, result: IProfileDocument) => {
      if (error || !result) {
        return res.status(500).json( error || { message: "Unable to save profile object." })
      }

      if (body.agency) {
        return addProfileToAgencyBusinessOrWorker("Agency", res.locals.decoded.id, result, res, next)
      } else if (body.business) {
        return addProfileToAgencyBusinessOrWorker("Business", res.locals.decoded.id, result, res, next)
      } else if (body.worker) {
        return addProfileToAgencyBusinessOrWorker("Worker",res.locals.decoded.id, result, res, next)
      } else {
        _error("Could not determine whether user is agency or business")
        return res.status(500).send( { message: "Could not determine whether user is agency or business" })
      }
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for adding a profile to agency, business or worker
 * @param user - string that tells whether to use Agency Business or Worker Model. Can either be "Agency", "Business" or "Worker"
 * @param id - id of the agency, business or worker in question
 * @param profile - the profile we are adding to agency/business/worker
 * @param res - Response
 * @param next - NextFunction
 */
 const addProfileToAgencyBusinessOrWorker = (user: string, id: string, profile: any, res: Response, next: NextFunction) => {
  try {
    if (user === "Agency") {
      Agency.findByIdAndUpdate(
        id,
        { $set: { profile: profile } },
        { new: true},
        (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(profile)
          }
        })
    } else if (user === "Business") {
      Business.findByIdAndUpdate(
        id,
        { $set: { profile: profile } },
        { new: true},
        (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(profile)
          }
        })
    } else if (user === "Worker") {
      Worker.findByIdAndUpdate(
        id,
        { $set: { profile: profile } },
        { new: true},
        (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(profile)
          }
        })
    } else {
      return res.status(500).send({ message: "ERROR"})
    }
  } catch (exception) {
    return next(exception)
  }
}

profileRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, (_req: Request, res: Response, _next: NextFunction) => {
  Profile.find()
    .exec()
    .then((results) => {
      return res.status(200).json({
          profile: results
      })
    })
    .catch((error) => {
      return res.status(500).json({
        message: error.message,
        error
      });
    });
})

profileRouter.get('/:id', authenticateToken, needsToBeAgencyBusinessOrWorker, (req: Request, res: Response, _next: NextFunction) => {
  Profile.findById(req.params.id).then(profile => {
    res.json(profile)
  })
})


profileRouter.put("/:profileId", authenticateToken, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {


  try {
    updateProfile(req,res,next)
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for updating the form. Helps reduce duplicate code.
 * @param agencyOrBusinessOrWorkerObject request.agency or request.business or worker. Depending on which one is trying to update their profile
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
const updateProfile = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params } = req
  try {
    const profileId: string = params.profileId
    let found: boolean = false
    /*
    if (agencyOrBusinessOrWorkerObject.profile.length === 0) {
      return res.status(403).send({ message: "You are not authorized to update this form" })
    }
    */
    
     
       
        Profile.findByIdAndUpdate(
          profileId,
          { ...req.body }, // Give the full form object, or the full questions object in said object, in body when updating questions. Otherwise all other questions are deleted.
          { new: true, runValidators: true, lean: true },
          (error: CallbackError, result: DocumentDefinition<IProfileDocument> | null) => {
            if (error || !result) {
              return res.status(500).send(error || { message: "Didn't get a result from database while updating profile" })
            } else {
              found = true;
              return res.status(200).send(result)
            }
          }
        )
      
    if (!found) {
      return res.status(404).send({ message: `Could not find profile with id ${profileId}` })
    }
  } catch (exception) {
    return next(exception)
  }
}
/*
profileRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const profile = {
    cover: body.cover,
    profilePicture: body.profilePicture,
    userInformation: body.userInformation,
    contactInformation: body.contactInformation,
    video: body.video,
    instructions: body.instructions
  }

  Profile.findByIdAndUpdate(request.params.id, profile, { new: true })
    .then(updatedProfile => {
      response.json(updatedProfile)
    })
    .catch(error => next(error))
})
*/
  export default profileRouter

