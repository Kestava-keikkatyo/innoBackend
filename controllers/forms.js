
const formsRouter = require("express").Router()
const authenticateToken = require("../utils/auhenticateToken")

const logger = require("../utils/logger")
const Form = require("../models/Form")
const Agency = require("../models/Agency")
const Business = require("../models/Business")
const { needsToBeAgencyOrBusiness } = require("../utils/middleware")

/**
 * Returns the added form.
 * Route for agency/business to add a form. Form given in body according to its schema model.
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
          response.status(500).send(error || { message: "Received no result when updating user" })
        } else {
          response.status(200).send(form)
        }
      })
  } catch (exception) {
    next(exception)
  }
}

/**
 * Route for agency/business to get their own forms
 * returns an array of form objects. response.body: [{form object}, {form object}, ...]
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
 * Route for agency/business to get all public forms, excluding their own forms.
 * returns an array of form objects. response.body: [{form object}, {form object}, ...]
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
    // Get all public forms, except forms with ids that are in myForms
    Form.find({ _id: { $nin: myForms }, isPublic: true }, (error, forms) => {
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

/**
 * Route for agency/business to update a single form.
 * Send updated form in body according to schema model
 * If you only need to update title, isPublic, or description field, you can just give that in the body, like: { "isPublic": false }
 * When updating any questions, give the full form object or the full questions object in it, in the body.
 */
formsRouter.put("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    if (request.agency) {
      updateForm(request.agency, request, response, next)
    } else if (request.business) {
      updateForm(request.business, request, response, next)
    } else {
      return response.status(500).send( { error: "Error determining whether user is agency or business" })
    }
  } catch (exception) {
    next(exception)
  }
})

/**
 * Helper function for updating the form. Helps reduce duplicate code.
 * @param agencyOrBusinessObject request.agency or request.business. Depending on which one is trying to update the form
 * @param request
 * @param response
 * @param next
 * @returns {*}
 */
const updateForm = (agencyOrBusinessObject, request, response, next) => {
  try {
    const formId = request.params.formId
    let found = false
    if (agencyOrBusinessObject.forms.length === 0) {
      return response.status(403).send({ message: "You are not authorized to update this form" })
    }
    for (const form of agencyOrBusinessObject.forms) {
      if (form.equals(formId)) {
        found = true
        Form.findByIdAndUpdate(
          formId,
          { ...request.body }, // Give the full form object or the full questions object in it, in body when updating questions. Otherwise all other questions are deleted.
          { new: true, runValidators: true },
          (error, result) => {
            if (error || !result) {
              return response.status(500).send(error || { message: "Didn't get a result from database while updating form" })
            } else {
              return response.status(200).send(result)
            }
          }
        )
      }
    }
    if (!found) {
      return response.status(404).send({ message: `Could not find form with id ${formId}` })
    }
  } catch (exception) {
    next(exception)
  }
}

/**
 * Route for agency/business to delete a single form. Has to be their own form, cannot delete public forms.
 */
formsRouter.delete("/:formId", authenticateToken, needsToBeAgencyOrBusiness, async (request, response, next) => {
  try {
    if (request.agency) {
      deleteForm(Agency, request.agency, request.params.formId, response, next)
    } else if (request.business) {
      deleteForm(Business, request.business, request.params.formId, response, next)
    } else {
      return response.status(500).send( { error: "Error determining whether user is agency or business" })
    }
  } catch (exception) {
    next(exception)
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
const deleteForm = (agencyOrBusiness, agencyOrBusinessObject, formId, response, next) => {
  try {
    let found = false
    if (agencyOrBusinessObject.forms.length === 0) {
      return response.status(403).send({ message: "You are not authorized to delete this form" })
    }
    for (const form of agencyOrBusinessObject.forms) {
      if (form.equals(formId)) {
        found = true
        Form.findByIdAndDelete(
          formId,
          (error, result) => {
            if (!result || error) {
              return response.status(500).send(error || { message: "Did not receive any result from database when deleting form" })
            } else {
              agencyOrBusiness.findByIdAndUpdate( // Once form is deleted, it also needs to be deleted from agency's or business' forms array
                agencyOrBusinessObject.id,
                { $pull: { forms: { $in: [formId] } } },
                (error, result) => {
                  if (error || !result) {
                    return response.status(500).send(error || { message: "Did not receive any result from database when deleting form's id from array" })
                  } else {
                    return response.status(204).send()
                  }
                }
              )
            }
          }
        )
      }
    }
    if (!found) {
      return response.status(404).send({ message: `Could not find form with id ${formId}` })
    }
  } catch (exception) {
    next(exception)
  }
}

module.exports = formsRouter