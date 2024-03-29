import express from "express";
import { tokenAuthentication } from "../middleware/authenticationMiddleware";
import {
  getFormById,
  getMyForms,
  postForm,
  updateForm,
  getFormByCommon,
  deleteForm,
  getPublicForms,
  getFormByPublic,
} from "../middleware/formMiddleware";
import { isAgencyOrBusiness, isWorkerOrBusinessOrAgency } from "../utils/authJwt";

const formRouter = express.Router();

/**
 * Route for user of role agency or business to create a new form.
 * @openapi
 * /form/:
 *   post:
 *     summary: Route for user of role agency or business to create a new form.
 *     description: Must be logged in as user of role agency or business
 *     tags: [Form, Agency, Business]
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
 *         description: Form created. Returns created form object.
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
formRouter.post("/", tokenAuthentication, isAgencyOrBusiness, postForm);

/**
 * Route for user of role agency or business to get common forms
 * @openapi
 * /form/common/:
 *   get:
 *     summary: Route for user of role agency or business to get common forms
 *     description: Must be logged in as an agency or business.
 *     tags: [Form, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the requested form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "404":
 *         description: No form was found with type common.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No form found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formRouter.get("/common/", tokenAuthentication, isAgencyOrBusiness, getFormByCommon);

/**
 * Route for user of role agency or business to get public forms
 * @openapi
 * /form/public/:
 *   get:
 *     summary: Route for user of role agency or business to get common forms
 *     description: Must be logged in as an agency or business.
 *     tags: [Job, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the requested form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "404":
 *         description: No form was found with type common.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No job found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formRouter.get("/public", tokenAuthentication, isAgencyOrBusiness, getFormByPublic);

/**
 * Route for user of role agency or business to get their own forms
 * @openapi
 * /form/:
 *   get:
 *     summary: Route for user of role agency or business to get their own forms
 *     description: Must be logged in as user of role agency or business
 *     tags: [Form, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns user's forms.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Form"
 *       "404":
 *         description: The requested forms are not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No forms found
 *       "500":
 *         description: An error occurred. Either a problem with the database or middleware.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formRouter.get("/myForm", tokenAuthentication, isAgencyOrBusiness, getMyForms);

/**
 * Route for user of role agency or business to get own form by id
 * @openapi
 * /form/myForm/{id}:
 *   get:
 *     summary: Route for user of role agency or business to get own form by its id
 *     description: Must be logged in as an agency or business.
 *     tags: [Form, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the requested form.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Returns the requested form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "404":
 *         description: No form was found with the requested ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No form found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formRouter.get("/myForm/:id", tokenAuthentication, isWorkerOrBusinessOrAgency, getFormById);

/**
 * Route for user of role agency or business to update own form.
 * @openapi
 * /form/update/{id}:
 *   put:
 *     summary: Route for user of role agency or business to update own form
 *     description: Must be logged in as an agency or business.
 *     tags: [Form, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the form to be updated.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Form"
 *     responses:
 *       "200":
 *         description: Returns the updated Form.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "404":
 *         description: No form was found!.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No form found
 */
formRouter.put("/update/:id", tokenAuthentication, isAgencyOrBusiness, updateForm);

/**
 * Route for user of type agency or business to get public forms
 * @openapi
 * /form/public/:
 *   get:
 *     summary: Route for user of type agency or business to get public forms
 *     description: Must be logged in as an agency or business.
 *     tags: [Form, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the requested forms.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Form"
 *       "404":
 *         description: No form was found with type common.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message:No form found
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
formRouter.get("/public/", tokenAuthentication, isAgencyOrBusiness, getPublicForms);

/**
 * Route for user of type agency or agency or business to delete form
 * @openapi
 * /form/delete/{formId}:
 *   delete:
 *     summary: Route for user of type agency or business to delete form
 *     description: Must be logged in as user of type agency or business.
 *     tags: [Form, Agency, Business]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *       - in: path
 *         name: id
 *         description: ID of the form to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *           example: 604021e581a9626810885657
 *     responses:
 *       "200":
 *         description: Form was deleted successfully.
 *       "404":
 *         description: The form with the requested ID is not existing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: No form was found with the requested ID {formId}
 */
formRouter.delete("/delete/:id", tokenAuthentication, isAgencyOrBusiness, deleteForm);

export default formRouter;
