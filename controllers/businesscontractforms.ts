import { IWorkerDocument } from './../objecttypes/modelTypes';
import express, { NextFunction, Request, Response } from 'express'
import authenticateToken from "../utils/auhenticateToken"

import { error as _error, info as _info } from "../utils/logger"
import BusinessContractForm from "../models/BusinessContractForm"
import Business from "../models/Business"
import Agency from "../models/Agency"
import Worker from "../models/Worker"

import { needsToBeAgencyBusinessOrWorker, needsToBeAgencyOrBusiness } from "../utils/middleware"
import { CallbackError, DocumentDefinition, Types } from "mongoose"
import { AnyQuestion, IAgencyDocument, IBusinessDocument, IFormDocument } from "../objecttypes/modelTypes"
import { IBaseBody, IBodyWithForm } from "../objecttypes/otherTypes"
import { ParamsDictionary } from "express-serve-static-core"


const businessContractFormsRouter = express.Router()


/**
 * Route to create a business contract form automatically when agency selects a normal form and tries to make a contract with a business or a worker. Or when a business tries to make a contract with an agency by sending collaboration request.
 * @openapi
 * /businesscontractforms:
 *   post:
 *     summary: Route to create a business contract form automatically when agency selects a normal form and tries to make a contract with a business or a worker. Or when a business tries to make a contract with an agency by sending collaboration request.
 *     description: Must be logged in as an agency.
 *     tags: [Agency, Business, BusinessContractForms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Form"
 *     responses:
 *       "200":
 *         description: Business contract form added. Returns added business contract form object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
businessContractFormsRouter.post("/", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<unknown, unknown, IBodyWithForm>, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    // BusinessContractForm validation and checking happens in schema itself
    const newBusinessContractForm: IFormDocument = new BusinessContractForm({
      title: body.title,
      isPublic: body.isPublic,
      filled: body.filled,
      common: body.common,
      questions: body.questions
    })
    if (body.description) {
      newBusinessContractForm.description = body.description
    }
    newBusinessContractForm.save((error: CallbackError, result: IFormDocument) => {
      if (error || !result) {
        return res.status(500).json(error || { message: "Unable to save form object." })
      }

      if (body.agency) {
        return addBusinessContractFormToAgencyOrBusiness("Agency", res.locals.decoded.id, result, res, next)
      } else if (body.business) {
        return addBusinessContractFormToAgencyOrBusiness("Business", res.locals.decoded.id, result, res, next)
      } else {
        _error("Could not determine whether user is agency or business.")
        return res.status(500).send({ message: "Could not determine whether user is agency or business." })
      }
    })
  } catch (exception) {
    return next(exception)
  }
})


/**
* Helper function for adding a business contract form to agency's or business' business contract forms array
* @param agencyOrBusiness - string that tells whether to use Agency or Business Model. Can either be "Agency" or "Business"
* @param id - id of the agency or business in question
* @param businessContractForm - the business contract form we are adding to agency/business
* @param res - Response
* @param next - NextFunction
*/
const addBusinessContractFormToAgencyOrBusiness = (agencyOrBusiness: string, id: string, businessContractForm: IFormDocument, res: Response, next: NextFunction) => {
  try {
    if (agencyOrBusiness === "Agency") {
      Agency.findByIdAndUpdate(
        id,
        { $addToSet: { businessContractForms: businessContractForm } },
        { new: true, omitUndefined: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IAgencyDocument | IBusinessDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(businessContractForm)
          }
        })
    } else if (agencyOrBusiness === "Business") {
      Business.findByIdAndUpdate(
        id,
        { $addToSet: { businessContractForms: businessContractForm } },
        { new: true, omitUndefined: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IAgencyDocument | IBusinessDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(businessContractForm)
          }
        })
    } else {
      return res.status(500).send({ message: "addFormToAgencyOrBusiness function called with an incorrect agencyOrBusiness parameter" })
    }
  } catch (exception) {
    return next(exception)
  }
}


/**
 * Route to get buisness contract form by id
 * @openapi
 * /businesscontractforms/{formId}:
 *   get:
 *     summary: Route for agency, business or worker to get the full business contract form object by its id
 *     description: Must be logged in as an agency, business or worker.
 *     tags: [Agency, Business, Worker, BusinessContractForms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: formId
 *         description: ID of the business contract form.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the wanted business contract form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FormWithArrayQuestions"
 *       "404":
 *         description: No business contract form was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Could not find business contract form with ID {formId}
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
businessContractFormsRouter.get("/:formId", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req

  try {
    BusinessContractForm.findById(params.formId,
      undefined,
      { lean: true },
      (error: CallbackError, businessContractForm: DocumentDefinition<IFormDocument> | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!businessContractForm) {
          return res.status(404).send({ message: `Could not find  business contract form with ID ${params.formId}` })
        }
        // Adding questions into an array in order according to the "ordering" property in each object.
        let newQuestions: Array<AnyQuestion> = []
        const questions = businessContractForm.questions
        for (const property in questions) {
          if (Object.prototype.hasOwnProperty.call(questions, property)) {
            for (const question of questions[property]) {
              newQuestions[question.ordering] = question
              newQuestions[question.ordering].questionType = property
            }
          }
        }
        let newForm: any = businessContractForm
        newForm.questions = newQuestions
        return res.status(200).send(newForm)
      })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /businesscontractform/{formId}:
 *   put:
 *     summary: Route for agency, business or worker to update a single business contract form when one of them tries to make business contract with another
 *     description: Must be logged in as an agency, business or worker.
 *     tags: [Agency, Business, Worker, BusinessContractForms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: formId
 *         description: ID of the business contract form which we want to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       description: |
 *         When updating any questions, give the full form object or just the full questions object, in the body. Otherwise all other questions get deleted.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Form"
 *     responses:
 *       "200":
 *         description: Returns the updated business contract form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
businessContractFormsRouter.put("/:formId", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    if (body.agency || body.business || body.worker) {
      updateBusinessContractForm(req, res, next)
    } else {
      return res.status(500).send({ message: "Error determining whether user is agency, business or worker" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Middleware function for updating business contract forms. Helps reduce duplicate code.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
const updateBusinessContractForm = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params } = req
  try {
    const formId: string = params.formId

    BusinessContractForm.findById(formId, (error: CallbackError, result: DocumentDefinition<IFormDocument> | null) => {
      if (error) {
        return res.status(500).send(error)
      }
      if (!result) {
        return res.status(404).send({ message: `Could not find business contract form with id ${formId}` })
      }
      return BusinessContractForm.findByIdAndUpdate(formId,
        { ...req.body }, // Give the full form object, or the full questions object in said object, in body when updating questions. Otherwise all other questions are deleted.
        { new: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IFormDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Didn't get a result from database while updating business contract form" })
          } else {
            return res.status(200).send(result)
          }
        })
    })
  } catch (exception) {
    return next(exception)
  }
}


/**
 * @openapi
 * /businesscontractforms/{formId}/{userId}:
 *   delete:
 *     summary: Route to delete the business contract form automatically when agency, business or worker declines the business contract.
 *     description: Must be logged in as an agency, business or worker.
 *     tags: [Agency, Business, Worker, BusinessContractForms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: formId
 *         description: ID of the form which we want to delete.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
*       - in: path
 *         name: userId
 *         description: The id of agency, business of worker with which the business contract declined.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "204":
 *         description: Business contract form was deleted successfully.
 *       "403":
 *         description: Not authorized to delete this business contract form
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: You are not authorized to delete this business contract form
 *       "404":
 *         description: No business contract form was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Could not find business contract form with ID {formId}
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
businessContractFormsRouter.delete("/:formId/:userId", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params, body } = req

  try {
    if (body.agency) {
      deleteBusinessContractForm("Agency", body.agency, params.formId, params.userId, res, next)
    } else if (body.business) {
      deleteBusinessContractForm("Business", body.business, params.formId, params.userId, res, next)
    } else if (body.worker) {
      deleteBusinessContractForm("Worker", body.worker, params.formId, params.userId, res, next)
    } else {
      return res.status(500).send({ message: "Error determining whether user is agency, business or worker." })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for deleting business contract form automatically when agency, business or worker declines business contract. Helps reduce duplicate code.
 * @param agencyBusinessOrWorker string that tells whether to use Agency, Business or Worker Model. Can either be "Agency", "Business" or "Worker".
 * @param agencyBusinessOrWorkerObject request.agency, request.business or request.worker. Depending on which one is trying to decline the business contract form
 * @param formId request.params.formId. The id of the business contract form to be deleted
 * @param userId request.params.userId. The id of agency, business of worker with which the business contract declined
 * @param res Response
 * @param next NextFunction
 */
const deleteBusinessContractForm = (agencyBusinessOrWorker: string, agencyBusinessOrWorkerObject: IAgencyDocument | IBusinessDocument | IWorkerDocument, formId: string, userId: string, res: Response, next: Function) => {
  try {
    let found: boolean = false
    if (agencyBusinessOrWorkerObject.businessContractForms?.length === 0) {
      return res.status(403).send({ message: "You are not authorized to delete this business contract form" })
    }

    for (const businessContractForm of (agencyBusinessOrWorkerObject.businessContractForms as Array<Types.ObjectId>)) {
      if (businessContractForm.equals(formId)) {
        found = true
        BusinessContractForm.findByIdAndDelete(
          formId,
          { lean: true },
          async (error: CallbackError, result: DocumentDefinition<IFormDocument> | null) => {
            if (error || !result) {
              return res.status(500).send(error || { message: "Did not receive any result from database when deleting business contract form" })
            }

            // Once business contract form is deleted, it also needs to be deleted from agency's/business's/worker's business contract forms array
            if (agencyBusinessOrWorker === "Agency") {
              return Agency.findByIdAndUpdate(
                agencyBusinessOrWorkerObject._id,
                { $pull: { businessContractForms: { $in: [formId] } } },
                { lean: true },
                async (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
                  if (error || !result) {
                    return res.status(500).send(error || { message: "Did not receive any result from database when deleting business contract form's id from array" })
                  } else {
                    /*
                    Delete also the business contract form id from the businessContractForms array of
                    the business/worker with which the business contract declined
                    */
                    // Check if the userId belongs to a business, then update his businessContractForms array. Ohterwise the userId belongs to a worker so update his businessContractForms array.
                    const business: IBusinessDocument | null = await Business.findById(userId)
                    if (business) {
                      await Business.updateOne({ _id: userId }, { $pull: { businessContractForms: { $in: [formId] } } })
                    } else {
                      await Worker.updateOne({ _id: userId }, { $pull: { businessContractForms: { $in: [formId] } } })
                    }
                    return res.status(204).send()
                  }
                }
              )
            }
            if (agencyBusinessOrWorker === "Business") {

              return Business.findByIdAndUpdate(
                agencyBusinessOrWorkerObject._id,
                { $pull: { businessContractForms: { $in: [formId] } } },
                { lean: true },
                async (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
                  if (error || !result) {
                    return res.status(500).send(error || { message: "Did not receive any result from database when deleting business contract form's id from array" })
                  } else {
                    /*
                    Delete also the business contract form id from the businessContractForms array of
                    the agency with which the business contract declined
                    */
                    await Agency.updateOne({ _id: userId }, { $pull: { businessContractForms: { $in: [formId] } } })
                    return res.status(204).send()
                  }
                }
              )
            }

            if (agencyBusinessOrWorker === "Worker") {

              const worker: IWorkerDocument | null = await Worker.findById(agencyBusinessOrWorkerObject._id)
              console.log("worker", worker)
              if (worker) {
                return Worker.updateOne(
                  { _id: agencyBusinessOrWorkerObject._id },
                  { $pull: { businessContractForms: { $in: [formId] } } },
                  { lean: true },
                  async (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
                    if (error || !result) {
                      return res.status(500).send(error || { message: "Did not receive any result from database when deleting business contract form's id from array" })
                    } else {
                      /*
                      Delete also the business contract form id from the businessContractForms array of
                      the agency with which the business contract declined
                      */
                      await Agency.updateOne({ _id: userId }, { $pull: { businessContractForms: { $in: [formId] } } })
                      return res.status(204).send()
                    }
                  }
                )
              }

            }

            return res.status(500).send({ message: "Error determining whether user is agency, business or worker." })

          }
        )
      }
    }
    if (!found) {
      return res.status(404).send({ message: `Could not find business contract form with ID ${formId}` })
    }
  } catch (exception) {
    return next(exception)
  }
}





export default businessContractFormsRouter