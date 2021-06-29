import express, { NextFunction, Request, Response } from "express"
import { IProfilePageDocument } from "../objecttypes/modelTypes"
import authenticateToken from "../utils/auhenticateToken"
import { needsToBeAgencyBusinessOrWorker } from "../utils/middleware"
import ProfilePage from "../models/ProfilePage"


//async (req: Request<unknown, unknown, IBodyWithProfile>, res: Response, next: NextFunction) => {
const profileRouter = express.Router()


profileRouter.post("/", authenticateToken, needsToBeAgencyBusinessOrWorker, (req: Request, res: Response, _next: NextFunction) => {
    const { body } = req

    // Form validation and checking happens in schema itself
    const profile: IProfilePageDocument = new ProfilePage({
      cover: body.cover,
      profilePicture: body.profilePicture,
      userInformation: body.userInformation,
      contactInformation: body.contactInformation,
      video: body.video,
      instructions: body.instructions
    })
    profile.save()
    .then(result => {
        return res.status(201).json({
          profile: result
        })
      })
      .catch((error) => {
        return res.status(500).json({
            message: error.message,
            error
        });
    });
})

profileRouter.get("/", authenticateToken, needsToBeAgencyBusinessOrWorker, (_req: Request, res: Response, _next: NextFunction) => {
    ProfilePage.find()
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
  ProfilePage.findById(req.params.id).then(profile => {
    res.json(profile)
  })
})


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

  ProfilePage.findByIdAndUpdate(request.params.id, profile, { new: true })
    .then(updatedProfile => {
      response.json(updatedProfile)
    })
    .catch(error => next(error))
})

  export default profileRouter

  //profile.save((error: CallbackError, result: IProfilePageDocument) => {