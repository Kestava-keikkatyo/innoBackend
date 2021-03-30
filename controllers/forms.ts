import express, {NextFunction, Request, Response} from 'express'
import authenticateToken from "../utils/auhenticateToken"

import { error as _error, info as _info } from "../utils/logger"
import Form from "../models/Form"
import Business from "../models/Business"
import Agency from "../models/Agency"
import { needsToBeAgencyOrBusiness } from "../utils/middleware"
import { getAgencyOrBusinessOwnForms } from "../utils/common"
import {CallbackError} from "mongoose";

const formsRouter = express.Router()

/**
 * Returns the added form.
 * Route for agency/business to add a form. Form given in body according to its schema model.
 */
formsRouter.post("/", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    // Form validation and checking happens in schema itself
    const newForm: any = new Form({
      title: body.title,
      isPublic: body.isPublic,
      questions: body.questions
    })
    if (body.description) {
      newForm.description = body.description
    }
    newForm.save((error: Error, result: any) => {
      if (error || !result) {
        return res.status(500).json( error || { message: "Unable to save form object." })
      }

      if (body.agency) {
        return addFormToAgencyOrBusiness( Agency, res.locals.decoded.id, result, res, next)
      } else if (body.business) {
        return addFormToAgencyOrBusiness( Business, res.locals.decoded.id, result, res, next)
      } else {
        _error("Could not determine whether user is agency or business")
        return res.status(500).send( { error: "Could not determine whether user is agency or business" })
      }
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for adding form to agency's or business' forms array
 * @param AgencyOrBusiness Agency or Business model
 * @param id id of the agency or business in question
 * @param form the form we are adding to agency/business
 * @param res
 * @param next
 */
const addFormToAgencyOrBusiness = (AgencyOrBusiness: any, id: string, form: any, res: Response, next: NextFunction) => {
  try {
    AgencyOrBusiness.findByIdAndUpdate(
      id,
      { $addToSet: { forms: [form] } },
      { new: true, omitUndefined: true, runValidators: true, lean: true },
      (error: any, result: any) => {
        if (!result || error) {
          return res.status(500).send(error || { message: "Received no result when updating user" })
        } else {
          return res.status(200).send(form)
        }
      })
  } catch (exception) {
    return next(exception)
  }
}

/**
 * Route for agency/business to get their own forms
 * returns an array. response.body: [{tags: [], title: "title", description: "description", id: "id"}, {...}, ...] //TODO update return in docs
 */
formsRouter.get("/me", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  const { query, body } = req
  try {
    let ownForms: any = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { error: "Error determining whether user is agency or business" })
    }

    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    // Get limit's amount of own forms in specified page
    const model: any = Form
    model.paginate({ _id: { $in: ownForms } },
      { projection: "title description tags", page: page, limit: limit, lean: true, leanWithId: false },
      (error: any, result: any) => {
        if (error || !result) {
          return res.status(500).send( error || { message: "Did not receive a result from database" })
        } else {
          if (result.docs.length === 0) {
            return res.status(404).send( error || { message: "Could not find any forms made by you" })
          }
          return res.status(200).send(result)
        }
      })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for agency/business to get all public forms, excluding their own forms.
 * returns an array. response.body: [{tags: [], title: "title", description: "description", id: "id"}, {...}, ...]
 */
formsRouter.get("/", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  const { body, query } = req
  try {
    let ownForms: any = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { error: "Error determining whether user is agency or business" })
    }
    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    // Get limit's amount of public forms in specified page, except forms with ids that are in ownForms
    const model: any = Form
    model.paginate({ _id: { $nin: ownForms }, isPublic: true },
      { projection: "title description tags", page: page, limit: limit, lean: true, leanWithId: false },
      (error: any, result: any) => {
        if (error || !result) {
          return res.status(500).send( error || { message: "Did not receive a result from database" })
        } else {
          if (result.docs.length === 0) {
            return res.status(404).send( { message: "Could not find any public forms not made by you" })
          }
          return res.status(200).json(result)
        }
      })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for agency/business to search public forms with a search string. Does not include their own forms.
 * req.query: q, page, limit
 */
formsRouter.get("/search", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  const { query, body } = req

  try {
    let ownForms: any = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { error: "Error determining whether user is agency or business" })
    }

    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }

    const searchQuery: string = decodeURIComponent(query.q as string)

    const model: any = Form
    model.paginate(
        { $text: { $search: searchQuery }, _id: { $nin: ownForms }, isPublic: true },
        {
          projection: { title: 1, description: 1, tags: 1, score: { $meta: "textScore" } },
          page: page,
          limit: limit,
          sort: { score: { $meta: "textScore" } },
          lean: true,
          leanWithId: false
        },
        (error: any, result: any) => {
          if (error || !result) {
            return res.status(500).send( error || { message: "Did not receive a result from database" })
          } else {
            if (result.docs.length === 0) {
              return res.status(404).send( { message: `Could not find any public forms not made by you with '${searchQuery}' query` })
            }
            return res.status(200).send(result)
          }
        })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for agency/business to search their own forms with a search string.
 * req.query: q, page, limit
 */
formsRouter.get("/me/search", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  const { query, body } = req

  try {
    let ownForms: any = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { error: "Error determining whether user is agency or business" })
    }

    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }

    const searchQuery: string = decodeURIComponent(query.q as string)

    const model: any = Form
    model.paginate(
        { $text: { $search: searchQuery }, _id: { $in: ownForms } },
        {
          projection: { title: 1, description: 1, tags: 1, score: { $meta: "textScore" } },
          page: page,
          limit: limit,
          sort: { score: { $meta: "textScore" } },
          lean: true,
          leanWithId: false
        },
        (error: any, result: any) => {
          if (error || !result) {
            return res.status(500).send( error || { message: "Did not receive a result from database" })
          } else {
            if (result.docs.length === 0) {
              return res.status(404).send( { message: `Could not find any forms made by you with '${searchQuery}' query` })
            }
            return res.status(200).send(result)
          }
        })
  } catch (exception) {
    return next(exception)
  }
})

/** TODO Should probably check if the form is either public or their own. Otherwise able to get private forms by knowing the id
 * Route for agency/business to get the full form object by its id.
 * Returns the form object according to the Form model, except the questions property has been changed into a sorted array according to the "ordering" properties.
 */
formsRouter.get("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req

  try {
    Form.findById(params.formId,
        undefined,
        { lean: true },
        (error: CallbackError, form: any) => {
      if (error || !form) {
        return res.status(404).send(error || { message: `Could not find form with id ${params.formId}` })
      }
      let newQuestions = []
      const questions = form.questions
      for (const property in questions) {
        if (Object.prototype.hasOwnProperty.call(questions, property)) {
          for (const question of questions[property]) {
            newQuestions[question.ordering] = question
            newQuestions[question.ordering].questionType = property
          }
        }
      }
      form.questions = newQuestions
      return res.status(200).send(form)
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Route for agency/business to update a single form.
 * Send updated form in body according to schema model
 * If you only need to update title, isPublic, or description field, you can just give that in the body, like: { "isPublic": false }
 * When updating any questions, give the full form object or the full questions object in it, in the body.
 */
formsRouter.put("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    if (body.agency) {
      updateForm(body.agency, req, res, next)
    } else if (body.business) {
      updateForm(body.business, req, res, next)
    } else {
      return res.status(500).send( { error: "Error determining whether user is agency or business" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for updating the form. Helps reduce duplicate code.
 * @param agencyOrBusinessObject request.agency or request.business. Depending on which one is trying to update the form
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const updateForm = (agencyOrBusinessObject: any, req: Request, res: Response, next: NextFunction) => {
  const { params } = req
  try {
    const formId = params.formId
    let found = false
    if (agencyOrBusinessObject.forms.length === 0) {
      return res.status(403).send({ message: "You are not authorized to update this form" })
    }
    for (const form of agencyOrBusinessObject.forms) {
      if (form.equals(formId)) {
        found = true
        Form.findByIdAndUpdate(
          formId,
          { ...req.body }, // Give the full form object, or the full questions object in said object, in body when updating questions. Otherwise all other questions are deleted.
          { new: true, runValidators: true, lean: true },
          (error, result) => {
            if (error || !result) {
              return res.status(500).send(error || { message: "Didn't get a result from database while updating form" })
            } else {
              return res.status(200).send(result)
            }
          }
        )
      }
    }
    if (!found) {
      return res.status(404).send({ message: `Could not find form with id ${formId}` })
    }
  } catch (exception) {
    return next(exception)
  }
}

/**
 * Route for agency/business to delete a single form. Has to be their own form, cannot delete public forms.
 */
formsRouter.delete("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (req, res, next) => {
  const { params, body } = req

  try {
    if (body.agency) {
      deleteForm(Agency, body.agency, params.formId, res, next)
    } else if (body.business) {
      deleteForm(Business, body.business, params.formId, res, next)
    } else {
      return res.status(500).send( { error: "Error determining whether user is agency or business" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for deleting the form. Helps reduce duplicate code.
 * @param agencyOrBusiness Agency or Business model
 * @param agencyOrBusinessObject request.agency or request.business. Depending on which one is trying to delete the form
 * @param formId request.params.formId. The id of the form that you want to delete
 * @param response
 * @param next
 * @returns {*}
 */
const deleteForm = (agencyOrBusiness: any, agencyOrBusinessObject: any, formId: string, res: Response, next: Function) => {
  try {
    let found = false
    if (agencyOrBusinessObject.forms.length === 0) {
      return res.status(403).send({ message: "You are not authorized to delete this form" })
    }
    for (const form of agencyOrBusinessObject.forms) {
      if (form.equals(formId)) {
        found = true
        Form.findByIdAndDelete(
          formId,
          undefined,
          (error: Error, result: any) => {
            if (!result || error) {
              return res.status(500).send(error || { message: "Did not receive any result from database when deleting form" })
            } else {
              agencyOrBusiness.findByIdAndUpdate( // Once form is deleted, it also needs to be deleted from agency's or business' forms array
                agencyOrBusinessObject._id,
                { $pull: { forms: { $in: [formId] } } },
                (error: Error, result: any) => {
                  if (error || !result) {
                    return res.status(500).send(error || { message: "Did not receive any result from database when deleting form's id from array" })
                  } else {
                    return res.status(204).send()
                  }
                }
              )
            }
            return result
          }
        )
      }
    }
    if (!found) {
      return res.status(404).send({ message: `Could not find form with id ${formId}` })
    }
  } catch (exception) {
    return next(exception)
  }
}

export default formsRouter