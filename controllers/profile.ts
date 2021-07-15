import express, { NextFunction, Request, Response } from "express"
import { IProfileDocument } from "../objecttypes/modelTypes"
import authenticateToken from "../utils/auhenticateToken"
import { needsToBeAgencyBusinessOrWorker } from "../utils/middleware"
import Profile from "../models/Profile"
import { IBodyWithProfile } from "../objecttypes/otherTypes"
import { CallbackError, DocumentDefinition } from "mongoose"
import {IAgencyDocument, IBusinessDocument, IWorkerDocument} from "../objecttypes/modelTypes"

import { error as _error, info as _info } from "../utils/logger"

import Business from "../models/Business"
import Agency from "../models/Agency"
import Worker from "../models/Worker"





const profileRouter = express.Router()


profileRouter.post("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<unknown, unknown, IBodyWithProfile>, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    // profile validation and checking happens in schema itself
    const newprofile: IProfileDocument = new Profile({
      name: body.name,
      phone: body.phone,
      email: body.email,
      address:{
          streetAddress: body.address.streetAddress,
          zipCode: body.address.zipCode,
          city: body.address.city
      },
      coverPhoto: body.coverPhoto,
      profilePicture: body.profilePicture,
      video: body.video,
      instructions: body.instructions,
      website: body.website
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


profileRouter.put("/:profileId", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request, res: Response, next: NextFunction) => {

  const { params } = req
  const profileId: string = params.profileId
  try {
    console.log("profileId", profileId)

    Profile.findByIdAndUpdate(
          profileId,
          { ...req.body }, // Give the full form object, or the full questions object in said object, in body when updating questions. Otherwise all other questions are deleted.
          { new: true, runValidators: true, lean: true },
          (error: CallbackError, result: DocumentDefinition<IProfileDocument> | null) => {
            if (!result) {
              return res.status(404).send({ message: `Could not find profile with id ${profileId}` })
            } else if(error){
              return res.status(500).send(error || { message: "Didn't get a result from database while updating profile" })
            }
            else {
              return res.status(200).send(result)
            }
          }
    )

  } catch (exception) {
    return next(exception)
  }



})

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

