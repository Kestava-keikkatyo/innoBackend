
const formsRouter = require("express").Router()
const authenticateToken = require("../utils/auhenticateToken")

const logger = require("../utils/logger")
const Form = require("../models/Form")
const Agency = require("../models/Agency")
const Business = require("../models/Business")
const { needsToBeAgencyOrBusiness } = require("../utils/middleware")

/**
 * Add form
 */
formsRouter.post("/", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    const body = request.body

    // Form validation and checking happens in schema itself
    const newForm = new Form({
      title: body.title,
      isPublic: body.isPublic,
      questions: body.questions
    })
    if (body.description) {
      newForm.description = body.description
    }
    newForm.save((error, result) => {
      if (error || !result) {
        return response.status(500).json( error || { message: "Unable to save form object." })
      }

      if (request.agency) {
        addFormToAgencyOrBusiness( Agency, response.locals.decoded.id, result, response, next)
      } else if (request.business) {
        addFormToAgencyOrBusiness( Business, response.locals.decoded.id, result, response, next)
      } else {
        logger.error("Could not determine whether user is agency or business")
        response.status(500).send( { error: "Could not determine whether user is agency or business" })
      }
    })
  } catch (exception) {
    next(exception)
  }
})

/**
 * Helper function for adding form to agency's or business' forms array
 * @param AgencyOrBusiness Agency or Business model
 * @param id id of the agency or business in question
 * @param form the form we are adding to agency/business
 * @param response
 * @param next
 */
const addFormToAgencyOrBusiness = (AgencyOrBusiness, id, form, response, next) => {
  try {
    AgencyOrBusiness.findByIdAndUpdate(
      id,
      { $addToSet: { forms: [form] } },
      { new: true, omitUndefined: true, runValidators: true },
      (error, result) => {
        if (!result || error) {
          response.status(401).send(error || { message: "Received no result when updating user" })
        } else {
          response.status(200).send(form)
        }
      })
  } catch (exception) {
    next(exception)
  }
}

/**
 * For getting your own forms
 */
formsRouter.get("/me", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    let formIds = null
    if (request.agency) {
      formIds = request.agency.forms
    } else if (request.business) {
      formIds = request.business.forms
    } else {
      return response.status(500).send( { error: "Error determining whether user is agency or business" })
    }
    let temp = null
    let forms = []
    for (const id of formIds) {
      temp = await Form.findById(id).exec()
      forms.push(temp)
    }
    response.status(200).json(forms)
  } catch (exception) {
    next(exception)
  }
})

/**
 * For getting all public forms, except your own
 */
formsRouter.get("/", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    let myForms = null
    if (request.agency) {
      myForms = request.agency.forms
    } else if (request.business) {
      myForms = request.business.forms
    } else {
      return response.status(500).send( { error: "Error determining whether user is agency or business" })
    }
    // Get all forms, except forms with ids that are in myForms
    Form.find({ _id: { $nin: myForms } }, (error, forms) => {
      if (error || !forms || forms.length === 0) {
        response.status(404).send( error || { message: "Could not find any public forms not made by you" })
      } else {
        response.status(200).json(forms)
      }
    })
  } catch (exception) {
    next(exception)
  }
})

module.exports = formsRouter