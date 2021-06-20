import express, {NextFunction, Request, Response} from 'express'
import authenticateToken from "../utils/auhenticateToken"

import { error as _error, info as _info } from "../utils/logger"
import Form from "../models/Form"
import Business from "../models/Business"
import Agency from "../models/Agency"
import Worker from "../models/Worker"
import { needsToBeAgencyBusinessOrWorker, needsToBeAgencyOrBusiness } from "../utils/middleware"
import { getAgencyOrBusinessOwnForms } from "../utils/common"
import {CallbackError, DocumentDefinition, PaginateResult, Types} from "mongoose"
import {AnyQuestion, IAgencyDocument, IBusinessDocument, IFormDocument, IWorkerDocument} from "../objecttypes/modelTypes"
import {IBaseBody, IBodyWithForm} from "../objecttypes/otherTypes"
import {ParamsDictionary} from "express-serve-static-core"

const formsRouter = express.Router()

/**
 * Route for agency/business to add a form. Form given in body according to its schema model.
 * @openapi
 * /forms:
 *   post:
 *     summary: Route for agency/business to add a form.
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, Forms]
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
 *         description: Form added. Returns added form object.
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
formsRouter.post("/", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request<unknown, unknown, IBodyWithForm>, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    // Form validation and checking happens in schema itself
    const newForm: IFormDocument = new Form({
      title: body.title,
      isPublic: body.isPublic,
      filled: body.filled,
      common: body.common,
      questions: body.questions
    })
    if (body.description) {
      newForm.description = body.description
    }
    newForm.save((error: CallbackError, result: IFormDocument) => {
      if (error || !result) {
        return res.status(500).json( error || { message: "Unable to save form object." })
      }

      if (body.agency) {
        return addFormToAgencyBusinessOrWorker("Agency", res.locals.decoded.id, result, res, next)
      } else if (body.business) {
        return addFormToAgencyBusinessOrWorker("Business", res.locals.decoded.id, result, res, next)
      } else if (body.worker) {
        return addFormToAgencyBusinessOrWorker("Worker",res.locals.decoded.id, result, res, next)
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
 * Helper function for adding a form to agency's or business' forms array
 * @param agencyOrBusiness - string that tells whether to use Agency or Business Model. Can either be "Agency" or "Business"
 * @param id - id of the agency or business in question
 * @param form - the form we are adding to agency/business
 * @param res - Response
 * @param next - NextFunction
 */
const addFormToAgencyBusinessOrWorker = (agencyOrBusiness: string, id: string, form: IFormDocument, res: Response, next: NextFunction) => {
  try {
    if (agencyOrBusiness === "Agency") {
      Agency.findByIdAndUpdate(
        id,
        { $addToSet: { forms: form } },
        { new: true, omitUndefined: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IAgencyDocument|IBusinessDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(form)
          }
        })
    } else if (agencyOrBusiness === "Business") {
      Business.findByIdAndUpdate(
        id,
        { $addToSet: { forms: form } },
        { new: true, omitUndefined: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IAgencyDocument|IBusinessDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(form)
          }
        })
    } else if (agencyOrBusiness === "Worker") {
      Worker.findByIdAndUpdate(
        id,
        { $addToSet: { forms: form } },
        { new: true, omitUndefined: true, runValidators: true, lean: true },
        (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
          if (error || !result) {
            return res.status(500).send(error || { message: "Received no result when updating user" })
          } else {
            return res.status(200).send(form)
          }
        })
    } else {
      return res.status(500).send({ message: "addFormToAgencyOrBusiness function called with an incorrect agencyOrBusiness parameter"})
    }
  } catch (exception) {
    return next(exception)
  }
}

/** TODO Fix doc. Only title, description, and tags are returned. Not whole form.
 * @openapi
 * /forms/me:
 *   get:
 *     summary: Route for agency/business to get their own forms
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, Forms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: page
 *         description: Page number you want to view
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             1
 *       - in: query
 *         name: limit
 *         description: The number of items you want to view per page
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             5
 *     responses:
 *       "200":
 *         description: Returns the agency's/business' forms paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedForms"
 *       "204":
 *         description: Agency/business doesn't have any forms.
 *       "400":
 *         description: Page or limit parameter is missing or incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Missing or incorrect page/limit parameter
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.get("/me", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query, body } = req
  try {
    let ownForms: Array<Types.ObjectId> | null = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
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
    Form.paginate({ _id: { $in: ownForms } },
      { projection: "title description tags", page: page, limit: limit, lean: true, leanWithId: false },
      (error: CallbackError, result: PaginateResult<DocumentDefinition<IFormDocument>>) => {
        if (error) {
          return res.status(500).send(error)
        } else if (result.docs.length === 0) {
          return res.status(204).send()
        } else {
          return res.status(200).send(result)
        }
      })
  } catch (exception) {
    return next(exception)
  }
})



formsRouter.get("/common", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query} = req
  try {
    const commonForms: Array<any> = await Form.find({ common: true }, { licenses: 0 })
    if (!commonForms) {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
    }

    const page: number = parseInt(query.page as string, 10)
    const limit: number = parseInt(query.limit as string, 10)
    if (page < 1 || !page) {
      return res.status(400).send({ message: "Missing or incorrect page parameter" })
    }
    if (limit < 1 || !limit) {
      return res.status(400).send({ message: "Missing or incorrect limit parameter" })
    }
    // Get limit's amount of common forms in specified page
    Form.paginate({ _id: { $in: commonForms } },
      { projection: "title description tags", page: page, limit: limit, lean: true, leanWithId: false },
      (error: CallbackError, result: PaginateResult<DocumentDefinition<IFormDocument>>) => {
        if (error) {
          return res.status(500).send(error)
        } else if (result.docs.length === 0) {
          return res.status(204).send()
        } else {
          return res.status(200).send(result)
        }
      })
  } catch (exception) {
    return next(exception)
  }
})

/** TODO Fix doc. Only title, description, and tags are returned. Not whole form.
 * @openapi
 * /forms:
 *   get:
 *     summary: Route for agency/business to get all public forms, excluding their own forms
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, Forms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: page
 *         description: Page number you want to view
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             1
 *       - in: query
 *         name: limit
 *         description: The number of items you want to view per page
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             5
 *     responses:
 *       "200":
 *         description: Returns the public forms paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedForms"
 *       "204":
 *         description: There are no public forms not made by the agency/business in question.
 *       "400":
 *         description: Page or limit parameter is missing or incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Missing or incorrect page/limit parameter
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.get("/", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, query } = req
  try {
    let ownForms: Array<Types.ObjectId> | null = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
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
    Form.paginate({ _id: { $nin: ownForms }, isPublic: true },
      { projection: "title description tags", page: page, limit: limit, lean: true, leanWithId: false },
      (error: CallbackError, result: PaginateResult<DocumentDefinition<IFormDocument>>) => {
        if (error) {
          return res.status(500).send(error)
        } else if (result.docs.length === 0) {
          return res.status(204).send()
        } else {
          return res.status(200).send(result)
        }
      })
  } catch (exception) {
    return next(exception)
  }
})

/** TODO Fix doc. Only title, description, and tags are returned. Not whole form.
 * @openapi
 * /forms/search:
 *   get:
 *     summary: Route for agency/business to search public forms with a search string. Does not include their own forms.
 *     description: Must be logged in a an agency or a business.
 *     tags: [Agency, Business, Forms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: page
 *         description: Page number you want to view
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             2
 *       - in: query
 *         name: limit
 *         description: The number of items you want to view per page
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             5
 *       - in: query
 *         name: q
 *         description: Search string used for searching the forms.
 *         required: true
 *         schema:
 *           type: string
 *           example:
 *             lomake
 *     responses:
 *       "200":
 *         description: Returns public forms that matched the search string, paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedForms"
 *       "204":
 *         description: Search string didn't match any public form.
 *       "400":
 *         description: Page or limit parameter is missing or incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Missing or incorrect page/limit parameter
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.get("/search", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query, body } = req

  try {
    let ownForms: Array<Types.ObjectId> | null = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
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

    Form.paginate(
        { $text: { $search: searchQuery }, _id: { $nin: ownForms }, isPublic: true },
        {
          projection: { title: 1, description: 1, tags: 1, score: { $meta: "textScore" } },
          page: page,
          limit: limit,
          sort: { score: { $meta: "textScore" } },
          lean: true,
          leanWithId: false
        },
        (error: CallbackError, result: PaginateResult<DocumentDefinition<IFormDocument>>) => {
          if (error) {
            return res.status(500).send(error)
          } else if (result.docs.length === 0) {
            return res.status(204).send()
          } else {
            return res.status(200).send(result)
          }
        })
  } catch (exception) {
    return next(exception)
  }
})

/** TODO Fix doc. Only title, description, and tags are returned. Not whole form.
 * @openapi
 * /forms/me/search:
 *   get:
 *     summary: Route for agency/business to search their own forms with a search string.
 *     description: Must be logged in a an agency or a business.
 *     tags: [Agency, Business, Forms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: query
 *         name: page
 *         description: Page number you want to view
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             2
 *       - in: query
 *         name: limit
 *         description: The number of items you want to view per page
 *         required: true
 *         schema:
 *           type: integer
 *           example:
 *             5
 *       - in: query
 *         name: q
 *         description: Search string used for searching the forms.
 *         required: true
 *         schema:
 *           type: string
 *           example:
 *             lomake
 *     responses:
 *       "200":
 *         description: Returns the agency's/business' forms that matched the search string, paginated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedForms"
 *       "204":
 *         description: Search string didn't match any of the agency's/business' forms.
 *       "400":
 *         description: Page or limit parameter is missing or incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Missing or incorrect page/limit parameter
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.get("/me/search", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { query, body } = req

  try {
    let ownForms: Array<Types.ObjectId> | null = getAgencyOrBusinessOwnForms(body)
    if (!ownForms) {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
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

    Form.paginate(
        { $text: { $search: searchQuery }, _id: { $in: ownForms } },
        {
          projection: { title: 1, description: 1, tags: 1, score: { $meta: "textScore" } },
          page: page,
          limit: limit,
          sort: { score: { $meta: "textScore" } },
          lean: true,
          leanWithId: false
        },
        (error: CallbackError, result: PaginateResult<DocumentDefinition<IFormDocument>>) => {
          if (error) {
            return res.status(500).send(error)
          } else if (result.docs.length === 0) {
            return res.status(204).send()
          } else {
            return res.status(200).send(result)
          }
        })
  } catch (exception) {
    return next(exception)
  }
})

/** TODO Should probably check if the form is either public or their own. Otherwise able to get private forms by knowing the id
 * Questions property has been changed into a sorted array according to the "ordering" properties.
 * @openapi
 * /forms/{formId}:
 *   get:
 *     summary: Route for agency/business to get the full form object with its id
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, Forms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: formId
 *         description: ID of the form which we want.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the wanted form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FormWithArrayQuestions"
 *       "404":
 *         description: No form was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Could not find form with ID {formId}
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.get("/:formId", authenticateToken, needsToBeAgencyBusinessOrWorker, async (req: Request, res: Response, next: NextFunction) => {
  const { params } = req

  try {
    Form.findById(params.formId,
      undefined,
      { lean: true },
      (error: CallbackError, form: DocumentDefinition<IFormDocument> | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!form) {
          return res.status(404).send({ message: `Could not find form with ID ${params.formId}` })
        }
        // Adding questions into an array in order according to the "ordering" property in each object.
        let newQuestions: Array<AnyQuestion> = []
        const questions = form.questions
        for (const property in questions) {
          if (Object.prototype.hasOwnProperty.call(questions, property)) {
            for (const question of questions[property]) {
              newQuestions[question.ordering] = question
              newQuestions[question.ordering].questionType = property
            }
          }
        }
        let newForm: any = form // Can't really change this from any. Blame front-end for wanting it this way lol.
        newForm.questions = newQuestions
        return res.status(200).send(newForm)
    })
  } catch (exception) {
    return next(exception)
  }
})

/**
 * @openapi
 * /forms/{formId}:
 *   put:
 *     summary: Route for agency/business to update a single form
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, Forms]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: formId
 *         description: ID of the form which we want to update.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       description: |
 *         If you only need to update title, isPublic, or description field, you can just give that in the body, like: { "isPublic": false }.
 *         When updating any questions, give the full form object or just the full questions object, in the body. Otherwise all other questions get deleted.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Form"
 *     responses:
 *       "200":
 *         description: Returns the updated form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "403":
 *         description: Can't update forms that you didn't create
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: You are not authorized to update this form
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.put("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req

  try {
    if (body.agency) {
      updateForm(body.agency, req, res, next)
    } else if (body.business) {
      updateForm(body.business, req, res, next)
    } else {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for updating the form. Helps reduce duplicate code.
 * @param agencyOrBusinessObject request.agency or request.business. Depending on which one is trying to update the form
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
const updateForm = (agencyOrBusinessObject: IAgencyDocument | IBusinessDocument, req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params } = req
  try {
    const formId: string = params.formId
    let found: boolean = false
    if (agencyOrBusinessObject.forms.length === 0) {
      return res.status(403).send({ message: "You are not authorized to update this form" })
    }
    for (const form of (agencyOrBusinessObject.forms as Array<Types.ObjectId>)) {
      if (form.equals(formId)) {
        found = true
        Form.findByIdAndUpdate(
          formId,
          { ...req.body }, // Give the full form object, or the full questions object in said object, in body when updating questions. Otherwise all other questions are deleted.
          { new: true, runValidators: true, lean: true },
          (error: CallbackError, result: DocumentDefinition<IFormDocument> | null) => {
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
 * @openapi
 * /forms/{formId}:
 *   delete:
 *     summary: Route for agency/business to delete one of their own forms
 *     description: Must be logged in as an agency or a business.
 *     tags: [Agency, Business, Forms]
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
 *     responses:
 *       "204":
 *         description: Form was deleted successfully.
 *       "403":
 *         description: Can't delete forms you didn't create.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: You are not authorized to delete this form
 *       "404":
 *         description: No form was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Could not find form with ID {formId}
 *       "500":
 *         description: Either an error occurred while calling the database, or something's wrong with the middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formsRouter.delete("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { params, body } = req

  try {
    if (body.agency) {
      deleteForm("Agency", body.agency, params.formId, res, next)
    } else if (body.business) {
      deleteForm("Business", body.business, params.formId, res, next)
    } else {
      return res.status(500).send( { message: "Error determining whether user is agency or business" })
    }
  } catch (exception) {
    return next(exception)
  }
})

/**
 * Helper function for deleting the form. Helps reduce duplicate code.
 * @param agencyOrBusiness string that tells whether to use Agency or Business Model. Can either be "Agency" or "Business"
 * @param agencyOrBusinessObject request.agency or request.business. Depending on which one is trying to delete the form
 * @param formId request.params.formId. The id of the form that you want to delete
 * @param res Response
 * @param next NextFunction
 */
const deleteForm = (agencyOrBusiness: string, agencyOrBusinessObject: IAgencyDocument | IBusinessDocument, formId: string, res: Response, next: Function) => {
  try {
    let found: boolean = false
    if (agencyOrBusinessObject.forms.length === 0) {
      return res.status(403).send({ message: "You are not authorized to delete this form" })
    }
    for (const form of (agencyOrBusinessObject.forms as Array<Types.ObjectId>)) {
      if (form.equals(formId)) {
        found = true
        Form.findByIdAndDelete(
          formId,
          { lean: true },
          (error: CallbackError, result: DocumentDefinition<IFormDocument> | null) => {
            if (error || !result) {
              return res.status(500).send(error || { message: "Did not receive any result from database when deleting form" })
            } else {
              if (agencyOrBusiness === "Agency") {
                return Agency.findByIdAndUpdate( // Once form is deleted, it also needs to be deleted from agency's forms array
                  agencyOrBusinessObject._id,
                  { $pull: { forms: { $in: [formId] } } },
                  { lean: true },
                  (error: CallbackError, result: DocumentDefinition<IAgencyDocument> | null) => {
                    if (error || !result) {
                      return res.status(500).send(error || { message: "Did not receive any result from database when deleting form's id from array" })
                    } else {
                      return res.status(204).send()
                    }
                  }
                )
              } else if (agencyOrBusiness === "Business") {
                return Business.findByIdAndUpdate( // Once form is deleted, it also needs to be deleted from business' forms array
                  agencyOrBusinessObject._id,
                  { $pull: { forms: { $in: [formId] } } },
                  { lean: true },
                  (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
                    if (error || !result) {
                      return res.status(500).send(error || { message: "Did not receive any result from database when deleting form's id from array" })
                    } else {
                      return res.status(204).send()
                    }
                  }
                )
              } else {
                return res.status(500).send({ message: "deleteForm function called with an incorrect agencyOrBusiness parameter. References to deleted form in Agency or Business were not able to be deleted"})
              }
            }
          }
        )
      }
    }
    if (!found) {
      return res.status(404).send({ message: `Could not find form with ID ${formId}` })
    }
  } catch (exception) {
    return next(exception)
  }
}

export default formsRouter