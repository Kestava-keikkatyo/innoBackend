import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { IBaseBody } from "../objecttypes/otherTypes";
import { CallbackError, DocumentDefinition, Types } from "mongoose";
import BusinessContract from "../models/BusinessContract";
import { error as _error, info } from "./logger";
import {
  IAgencyDocument,
  IBusinessContractDocument,
  IBusinessDocument,
  IWorkerDocument
} from "../objecttypes/modelTypes";
import Business from "../models/Business";
import Worker from "../models/Worker";
import Agency from "../models/Agency";

/**
 * Checks if a BusinessContract with url param :businessContractId exists.
 * BusinessContract object from database is populated to request.body.businessContract.
 * @param {String} req.params.businessContractId - BusinessContractId from parameter (url).
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 404 - request.body: { error: "No BusinessContract found with the request :businessContractId." }
 * @throws {JSON} Status 400 - request.body: { error: "No :businessContractId in url." }
 * @returns {NextFunction} next()
 */
export const businessContractExists = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
  } catch (exception) {
    return res.status(403).send({ message: "Note: businessContractId must be string." })
  }
  try {
    if (businessContractId) {
      return BusinessContract.findById({ _id: businessContractId }, (error: CallbackError, result: IBusinessContractDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({ error: "No BusinessContract found with the request :businessContractId." })
        } else {
          body.businessContract = result
          return next()
        }
      })
    } else {
      return res.status(400).send({ error: "No :businessContractId in url." })
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * Checks if BusinessContract includes user that is trying to get it.
 * Saves to request.body.userInBusinessContract true if user is in contract and false if not.
 * @param {BusinessContract} req.body.businessContract - BusinessContract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @throws {JSON} Status 500 - response.body: { exception }
 * @returns {NextFunction} next()
 */
export const businessContractIncludesUser = (req: Request<unknown, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body } = req
  try {
    if (body.businessContract !== undefined) {
      if (body.businessContract.agency.toString() === res.locals.decoded.id.toString()) {
        body.userInBusinessContract = true
      } else {
        if (body.businessContract.madeContracts.businesses.includes(res.locals.decoded.id)) {
          body.userInBusinessContract = true
        } else if (body.businessContract.madeContracts.workers.includes(res.locals.decoded.id)) {
          body.userInBusinessContract = true
        }
      }
    } else {
      body.userInBusinessContract = false
    }
    return next()
  } catch (exception) {
    _error("exception:\n" + exception)
    return res.status(500).send("Exception:\n" + exception)
  }
}
/**
 * This middleware is used to make BusinessContract for agency in
 * BusinessContract.ts post route.
 * @param {Request} _req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {JSON} Status 201 - Header: { Location: domainUrl + businessContractsApiPath + contract._id }, Response.body: { contract }
 */
export const makeBusinessContract = (_req: Request, res: Response) => {
  const domainUrl: string = "http://localhost:3001/"
  const businessContractsApiPath: string = "api/businesscontracts/"
  try {
    //First check that Agency doesn't already have BusinessContract
    return BusinessContract.find({ // Check if worker has already businessContract with agency.
      agency: res.locals.decoded.id
    },
      undefined,
      { lean: true },
      (error: CallbackError, docs: DocumentDefinition<IBusinessContractDocument>[]) => {
        if (error) {
          return res.status(500).send(error)
        } else {
          if (docs.length >= 1) {
            return res.status(302).send({ doc: docs, message: "Agency already has BusinessContract." })
          } else {
            //Next initialize BusinessContract fields.
            const businessContract: IBusinessContractDocument = new BusinessContract({
              agency: res.locals.decoded.id,
              madeContracts: {
                businesses: [],
                workers: []
              },
              requestContracts: {
                businesses: [],
                workers: []
              }
            })
            //Then save BusinessContract to db.
            return businessContract.save((error: CallbackError, contract: IBusinessContractDocument) => {
              if (error) {
                return res.status(500).send(error)
              } else {
                info("BusinessContract created with ID " + businessContract._id)
                //Link BusinessContract to Agency
                return Agency.findOneAndUpdate(
                  { _id: res.locals.decoded.id },
                  { $addToSet: { businessContracts: businessContract._id } },
                  { lean: true },
                  (error: CallbackError, doc: DocumentDefinition<IAgencyDocument> | null) => {
                    if (error || !doc) {
                      // TODO? Delete contract if failed.  Onko todo? Oli vain normaalina kommenttina
                      return res.status(500).send(error || { message: "Received no result from database, BusinessContract couldn't be linked to Agency." })
                    } else {
                      return res.status(201).header({ Location: domainUrl + businessContractsApiPath + contract._id.toString(), }).json({ contract })
                    }
                  })
              }
            })
          }
        }
      })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to add worker or business to BusinessContract.
 * Used in put "/:businessContractId/add" route. Function initializes update that
 * adds userId to BusinessContractDocumentObject receivedContracts workers or businesses array.
 * After initialization is finnished function returns next().
 * If user is already in contract this fucntion return message informing that user is in contract with
 * agency already.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const addContractToBusinessContract = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(res.locals.decoded.id)
    body.businessContractUpdateFilterQuery = { _id: businessContractId }
  } catch (exception) {
    return res.status(403).send({ message: "Note: businessContractId must be string." })
  }
  try {
    //Täytyy tarkistaa ennen kuin update voidaan alustaa että onko käyttäjä jo tehnyt asiakassopimuksen yrityksen kanssa.
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      return Business.updateOne({ _id: userId }, { $addToSet: { businessContracts: businessContractId } }, null, (err, result) => {
        if (err || !result) {
          return res.status(500).send({ message: err })
        }
        else if (result.nModified === 0) {
          return res.status(409).send({ message: "Business is already in contract." })
        }
        else {
          body.businessContractUpdate = {
            $addToSet: {
              'receivedContracts.businesses': { businessId: userId, formId: null }
            }
          }
          body.businessContractUpdateFilterQuery = { _id: businessContractId }
          return next()
        }
      })
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        return Worker.updateOne({ _id: userId }, { $addToSet: { businessContracts: businessContractId } }, null, (err, result) => {
          if (err || !result) {
            return res.status(500).send({ message: "Something went wrong with update." })
          }
          else if (result.nModified === 0) {
            return res.status(409).send({ message: "Worker is already in contract." })
          }
          else {
            body.businessContractUpdate = {
              $addToSet: {
                'receivedContracts.workers': { workerId: userId, formId: null }
              }
            }
            body.businessContractUpdateFilterQuery = { _id: businessContractId }
            return next()
          }
        })
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used in put route "/:businessContractId/:userId/add".
 * Function checks that Business or Worker is found and initializes BusinessContract update that
 * adds userId to pendingContracts workers/businesses array.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const initBusinessContractAddUpdate = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(params.userId)
    formId = Types.ObjectId(body.form) //Tämä kohta epäonnistuu jos ei lähetetä formia BusinessContract pyynnön mukana.
  } catch (exception) {
    return res.status(403).send({ message: "Note: businessContractId and userId must be string." })
  }
  try {
    //Aluksi tarkistetaan että Agency on Asiakassopimuksen omistaja.
    if (body.businessContract !== undefined && res.locals.decoded.id.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({ message: "Agency was not right owner of BusinessContract." })
    }
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    //Tarkistetaan että löytyykö Yritys jonka kanssa halutaan tehdä Asiakassopimus.
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty jo yrityssopimus.
      if (index[0].businessContracts.includes(businessContractId)) {
        //Lähetetään vastausteksti missä kerrotaan että Yritys löytyy jo sopimuksesta.
        return res.status(400).send({ message: "Business was already in contract." })
        //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        body.businessContractUpdate = {
          $addToSet: {
            'pendingContracts.businesses': { businessId: userId, formId: formId }
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId }
        await Business.updateOne({ _id: userId }, { $addToSet: { forms: formId, businessContracts: businessContractId } })
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      //Tarkistetaan onko Työntekijän kanssa tehty jo yrityssopimus.
      if (index.length == 1) {
        if (index[0].businessContracts.includes(businessContractId)) {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä löytyy jo sopimuksesta.
          return res.status(400).send({ message: "Worker was already in contract." })
          //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          body.businessContractUpdate = {
            $addToSet: {
              'pendingContracts.workers': { workerId: userId, formId: formId }
            }
          }
          body.businessContractUpdateFilterQuery = { _id: businessContractId }
          await Worker.updateOne({ _id: userId }, { $addToSet: { forms: formId, businessContracts: businessContractId } })
        }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used by Agency to decline BusinessContract.
 * Used in PUT route /:businessContractId/:userId/accept.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const declineBusinessContract = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(params.userId)
  } catch (exception) {
    return res.status(403).send({ message: "Note: businessContractId and userId must be string." })
  }
  try {
    //Aluksi tarkistetaan että Agency on Asiakassopimuksen omistaja.
    if (body.businessContract !== undefined && res.locals.decoded.id.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({ message: "Agency was not right owner of BusinessContract." })
    }
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty asiakassopimus.
      if (index[0].businessContracts.includes(businessContractId)) {
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.businesses': { businessId: userId },
            'pendingContracts.businesses': { businessId: userId },
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId }
        await Business.updateOne({ _id: userId }, { $pull: { businessContracts: businessContractId } })
        //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        //Lähetetään vastausteksti missä kerrotaan että Yritys ei löytynyt sopimuksesta.
        return res.status(400).send({ message: "Business was not in contract." })
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        //Tarkistetaan onko Työntekijän kanssa tehty asiakassopimus.
        if (index[0].businessContracts.includes(businessContractId)) {
          body.businessContractUpdate = {
            $pull: {
              'requestContracts.workers': { workerId: userId },
              'pendingContracts.workers': { workerId: userId }
            }
          }
          body.businessContractUpdateFilterQuery = { _id: businessContractId }
          await Worker.updateOne({ _id: userId }, { $pull: { businessContracts: businessContractId } })
          //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä ei löytynyt sopimuksesta.
          return res.status(400).send({ message: "Worker was already in contract." })
        }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to update BusinessContract.
 * Runs findOneAndUpdate query to BusinessContract. Used as last middleware to run update.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {JSON} Status 200: doc
 */
export const businessContractUpdate = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response) => {
  const { body, params } = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractId)
  } catch (exception) {
    return res.status(403).send({ message: "Note: contractId must be string." })
  }
  try {
    const updateFields = body.businessContractUpdate
    return BusinessContract.updateOne(body.businessContractUpdateFilterQuery,
      updateFields,
      undefined,
      (error: CallbackError, rawResult: DocumentDefinition<IBusinessContractDocument> | null) => {
        if (error) {
          return res.status(500).send(error.message)
        } else if (!rawResult) {
          return res.status(400).send({ success: false, error: "Could not update BusinessContract with id " + id })
        } else {
          return res.status(200).send(rawResult)
        }
      })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to update BusinessContract by agency.
 * Runs findOneAndUpdate query to BusinessContract. And then populates requestContract and madeContracts.
 * Used as last middleware to run update.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {JSON} Status 200: doc
 */
export const businessContractAgencyUpdate = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response) => {
  const { body, params } = req
  let id: Types.ObjectId
  const populatePath = 'madeContracts.businesses.businessId madeContracts.workers.workerId requestContracts.businesses.businessId '
    + 'requestContracts.workers.workerId pendingContracts.workers.workerId pendingContracts.businesses.businessId '
    + 'receivedContracts.businesses.businessId receivedContracts.workers.workerId'
  const populateFields = 'name email createdAt userType'
  try {
    id = Types.ObjectId(params.contractId)
  } catch (exception) {
    return res.status(403).send({ message: "Note: contractId must be string." })
  }
  try {
    const updateFields = body.businessContractUpdate
    return BusinessContract.findOneAndUpdate(body.businessContractUpdateFilterQuery,
      updateFields,
      { new: true, lean: true }).populate(populatePath, populateFields).exec(
        (error: CallbackError, rawResult: DocumentDefinition<IBusinessContractDocument> | null) => {
          if (error) {
            return res.status(500).send(error.message)
          } else if (!rawResult) {
            return res.status(400).send({ success: false, error: "Could not update BusinessContract with id " + id })
          } else {
            return res.status(200).send(rawResult)
          }
        })
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to initialize BusinessContract update,
 * that changes users Id location in BusinessContract document.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next
 */
export const initBusinessContractSendUpdate = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(res.locals.decoded.id)
    formId = Types.ObjectId(body.form)
  } catch (exception) {
    return res.status(403).send({ message: "ContractId must be string." })
  }
  const businessContract: IBusinessContractDocument | null = await BusinessContract.findOne({ _id: businessContractId })
  try {
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      body.businessContractUpdate = {
        $pull: {
          'pendingContracts.businesses': { businessId: userId }
        },
        $addToSet: {
          'requestContracts.businesses': { businessId: userId, formId: formId }
        }
      }
      body.businessContractUpdateFilterQuery = { _id: businessContractId }

      // update agency forms with the new buisness contract form
      await Agency.updateOne({ _id: businessContract?.agency }, { $addToSet: { forms: formId } })
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        body.businessContractUpdate = {
          $pull: {
            'pendingContracts.workers': { workerId: userId }
          },
          $addToSet: {
            'requestContracts.workers': { workerId: userId, formId: formId }
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId }

        // update agency forms with the new buisness contract form
        await Agency.updateOne({ _id: businessContract?.agency }, { $addToSet: { forms: formId } })
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to initialize BusinessContract update,
 * removes id from pendingContracts array. Used in routes that accept Worker or Business.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {NextFunction} next
 */
export const initBusinessContractDeclineUpdate = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(res.locals.decoded.id)
  } catch (exception) {
    return res.status(403).send({ message: "ContractId must be string." })
  }
  try {
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      body.businessContractUpdate = {
        $pull: {
          'pendingContracts.businesses': { businessId: userId },
          'receivedContracts.businesses': { businessId: userId }
        }
      }
      body.businessContractUpdateFilterQuery = { _id: businessContractId }
      await Business.updateOne({ _id: userId }, { $pull: { businessContracts: businessContractId } })
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        body.businessContractUpdate = {
          $pull: {
            'pendingContracts.workers': { workerId: userId },
            'receivedContracts.workers': { workerId: userId }
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId }
        await Worker.updateOne({ _id: userId }, { $pull: { businessContracts: businessContractId } })
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to initialize BusinessContract update that,
 * removes id from requestContracts array and moves it to madeContracts array.
 * Used by Agency in accept route to finally confirm BusinessContract with Business or Worker.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {NextFunction} next
 */
export const initBusinessContractAcceptUpdate = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(params.userId)
    formId = Types.ObjectId(body.form)
  } catch (exception) {
    return res.status(403).send({ message: "ContractId must be string." })
  }
  try {
    //Aluksi tarkistetaan että Agency on Asiakassopimuksen omistaja.
    if (body.businessContract !== undefined && res.locals.decoded.id.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({ message: "Agency was not right owner of BusinessContract." })
    }
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty asiakassopimus.
      if (index[0].businessContracts.includes(businessContractId)) {
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.businesses': { businessId: userId },
            'receivedContracts.businesses': { businessId: userId }
          },
          $addToSet: {
            'madeContracts.businesses': { businessId: userId, formId: formId }
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId }
        //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        //Lähetetään vastausteksti missä kerrotaan että Yritys ei löytynyt sopimuksesta.
        return res.status(400).send({ message: "Business was not in contract." })
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        //Tarkistetaan onko Työntekijän kanssa tehty asiakassopimus.
        if (index[0].businessContracts.includes(businessContractId)) {
          body.businessContractUpdate = {
            $pull: {
              'requestContracts.workers': { workerId: userId },
              'receivedContracts.workers': { workerId: userId }
            },
            $addToSet: {
              'madeContracts.workers': { workerId: userId, formId: formId }
            }
          }
          body.businessContractUpdateFilterQuery = { _id: businessContractId }
          //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä ei löytynyt sopimuksesta.
          return res.status(400).send({ message: "Worker was not in contract." })
        }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({ exception })
  }
}
/**
 * This middleware function is used to save filled form that is linked to
 * user (Worker/Business) in BusinessContractDocumentObject.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {NextFunction} next
 */
export const initBusinessContractFormUpdate = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(res.locals.decoded.id)
    formId = Types.ObjectId(body.form)
  } catch (exception) {
    return res.status(403).send({ message: "ContractId must be string." })
  }
  try {
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      body.businessContractUpdate = {
        $set: {
          "pendingContracts.businesses.$.formId": formId
        }
      }
      body.businessContractUpdateFilterQuery = { _id: businessContractId, "pendingContracts.businesses": { $elemMatch: { businessId: userId } } }
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        body.businessContractUpdate = {
          $set: {
            "pendingContracts.workers.$.formId": formId
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId, "pendingContracts.workers": { $elemMatch: { workerId: userId } } }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches " + userId })
      }
    }
    return next()
  } catch (exeption) {
    return res.status(404).send({ message: "Couldn't find user." })
  }
}
/**
 * This middleware function is used to send back contract that Worker or Business send
 * to Agency. Used in put sendBack route.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {NextFunction} next
 */
export const initBusinessContractSendBackUpdate = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const { body, params } = req
  let businessContractId: Types.ObjectId
  let agencyId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    agencyId = Types.ObjectId(res.locals.decoded.id)
    userId = Types.ObjectId(params.userId)
    formId = Types.ObjectId(body.form)
  } catch (exception) {
    return res.status(403).send({ message: "ContractId must be string." })
  }
  try {
    if (body.businessContract !== undefined && agencyId.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({ message: "Agency was not right owner of BusinessContract." })
    }
    const index: IBusinessDocument[] = await Business.find({ _id: userId })
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty asiakassopimus.
      if (index[0].businessContracts.includes(businessContractId)) {
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.businesses': { businessId: userId },
            'receivedContracts.businesses': { businessId: userId }
          },
          $addToSet: {
            'pendingContracts.businesses': { businessId: userId, formId: formId }
          }
        }
        body.businessContractUpdateFilterQuery = { _id: businessContractId }
        //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        //Lähetetään vastausteksti missä kerrotaan että Yritys ei löytynyt sopimuksesta.
        return res.status(400).send({ message: "Business was not in contract." })
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({ _id: userId })
      if (index.length == 1) {
        //Tarkistetaan onko Työntekijän kanssa tehty asiakassopimus.
        if (index[0].businessContracts.includes(businessContractId)) {
          body.businessContractUpdate = {
            $pull: {
              'requestContracts.workers': { workerId: userId },
              'receivedContracts.workers': { workerId: userId }
            },
            $addToSet: {
              'pendingContracts.workers': { workerId: userId, formId: formId }
            }
          }
          body.businessContractUpdateFilterQuery = { _id: businessContractId }
          //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä ei löytynyt sopimuksesta.
          return res.status(400).send({ message: "Worker was not in contract." })
        }
      } else {
        return res.status(404).send({ message: "Couldn't find user who matches" + userId })
      }
    }
    return next()
  } catch (exception) {
    return res.status(404).send({ message: "Init send back failed." })
  }
}


export default {}