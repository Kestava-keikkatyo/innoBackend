import {NextFunction, Request, Response} from "express";
import {ParamsDictionary} from "express-serve-static-core";
import {IBaseBody} from "../objecttypes/otherTypes";
import {CallbackError, DocumentDefinition, Types} from "mongoose";
import BusinessContract from "../models/BusinessContract";
import {error as _error, info} from "./logger";
import {
  IAgencyDocument,
  IBusinessContractDocument,
  IBusinessDocument,
  IWorkerDocument
} from "../objecttypes/modelTypes";
import Business from "../models/Business";
import Worker from "../models/Worker";
import Agency from "../models/Agency";
import {businessExistsCallback, workerExistsCallback} from "./common";

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
  const {body, params} = req
  let businessContractId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
  } catch (exception) {
    return res.status(403).send({message: "Note: businessContractId must be string."})
  }
  try {
    if (businessContractId) {
      return BusinessContract.findById({_id: businessContractId}, (error: CallbackError, result: IBusinessContractDocument | null) => {
        if (error) {
          return res.status(500).send(error)
        } else if (!result) {
          return res.status(404).send({error: "No BusinessContract found with the request :businessContractId."})
        } else {
          body.businessContract = result
          return next()
        }
      })
    } else {
      return res.status(400).send({error: "No :businessContractId in url."})
    }
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body} = req
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
      {lean: true},
      (error: CallbackError, docs: DocumentDefinition<IBusinessContractDocument>[]) => {
        if (error) {
          return res.status(500).send(error)
        } else {
          if (docs.length >= 1) {
            return res.status(302).send({doc: docs, message: "Agency already has BusinessContract."})
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
                  {_id: res.locals.decoded.id},
                  {$addToSet: {businessContracts: businessContract._id}},
                  {lean: true},
                  (error: CallbackError, doc: DocumentDefinition<IAgencyDocument> | null) => {
                    if (error || !doc) {
                      // TODO? Delete contract if failed.  Onko todo? Oli vain normaalina kommenttina
                      return res.status(500).send(error || {message: "Received no result from database, BusinessContract couldn't be linked to Agency."})
                    } else {
                      return res.status(201).header({Location: domainUrl + businessContractsApiPath + contract._id.toString(),}).json({contract})
                    }
                  })
              }
            })
          }
        }
      })
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * This middleware function is used to add worker or business to BusinessContract.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const addContractToBusinessContract = (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.businessContractId)
    body.businessContractUpdateFilterQuery = {_id: id}
  } catch (exception) {
    return res.status(403).send({message: "Note: businessContractId must be string."})
  }
  try {
    //Check if worker is trying to make BusinessContract
    if (!body.worker) {
      //If worker is null check business
      if (!body.business) {
        //If business is null check agency
        if (!body.agency || !body.userId) {
          return res.status(400).send({message: "Could not identify who tried to create the contract or userId was undefined."})
        } else {
          //If agency is trying to make BusinessContract
          //Then we check which user agency wants to add
          return businessExistsCallback(body.userId, (result: IBusinessDocument | null) => {
            if (!result) {
              return workerExistsCallback(body.userId, (result: IWorkerDocument | null) => {
                if (!result) {
                  return res.status(404).send({message: "Couldn't find user with userId:" + body.userId})
                } else {
                  body.businessContractUpdate = {
                    $addToSet: {
                      'madeContracts.workers': body.userId
                    }
                  }
                  return Worker.findOneAndUpdate(
                    {_id: body.userId},
                    {$addToSet: {businessContracts: id}},
                    {lean: true},
                    (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
                      if (error || !result) {
                        return res.status(500).send(error || {message: "Received no result from database when adding trace to Worker"})
                      } else {
                        return next()
                      }
                    })
                }
              })
            } else {
              body.businessContractUpdate = {
                $addToSet: {
                  'madeContracts.businesses': body.userId
                }
              }
              //Now we can add trace to Business businessContracts list.
              return Business.findOneAndUpdate(
                {_id: body.userId},
                {$addToSet: {businessContracts: id}},
                {lean: true},
                (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
                  if (error || !result) {
                    return res.status(500).send(error || {message: "Received no result from database when adding trace to Business"})
                  } else {
                    return next()
                  }
                })
            }
          })
        }
      } else {
        //If business is trying to make BusinessContract we first check that is Business already in contract.
        if (body.businessContract?.madeContracts.businesses.includes(res.locals.decoded.id)) {
          return res.status(401).send({message: "User is already in contract."})
        } else {
          body.businessContractUpdate = {
            $addToSet: {
              'requestContracts.businesses': body.business._id
            }
          }
          //Now we can add trace to Business businessContracts list.
          return Business.findOneAndUpdate(
            {_id: res.locals.decoded.id},
            {$addToSet: {businessContracts: id}},
            {lean: true},
            (error: CallbackError, result: DocumentDefinition<IBusinessDocument> | null) => {
              if (error || !result) {
                return res.status(500).send(error || {message: "Received no result from database when adding trace to Business"})
              } else {
                return next()
              }
            })
        }
      }
    } else {
      //If worker is trying to make BusinessContract we first check that is Worker already in contract.
      if (body.businessContract?.madeContracts.workers.includes(res.locals.decoded.id)) {
        return res.status(401).send({message: "User is already in contract."})
      } else {
        body.businessContractUpdate = {
          $addToSet: {
            'requestContracts.workers': body.worker._id
          }
        }
        //Now we can add trace to Workers businessContracts list.
        return Worker.findOneAndUpdate(
          {_id: res.locals.decoded.id},
          {$addToSet: {businessContracts: id}},
          {lean: true},
          (error: CallbackError, result: DocumentDefinition<IWorkerDocument> | null) => {
            if (error || !result) {
              return res.status(500).send(error || {message: "Received no result from database when adding trace to Worker"})
            } else {
              return next()
            }
          })
      }
    }
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * This middleware function is used in put route accept.
 * Function checks that Business or Worker is found and initializes BusinessContract update that removes
 * id from requestContracts workers/businesses array and adds it to madeContracts workers/businesses array.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next - NextFunction.
 * @returns {NextFunction} next()
 */
export const acceptBusinessContract = async (req: Request<ParamsDictionary, unknown, IBaseBody>, res: Response, next: NextFunction) => {
  const {body, params} = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(params.userId)
    formId = Types.ObjectId(body.form) //Tämä kohta epäonnistuu jos ei lähetetä formia BusinessContract pyynnön mukana.
  } catch (exception) {
    return res.status(403).send({message: "Note: businessContractId and userId must be string."})
  }
  try {
    //Aluksi tarkistetaan että Agency on Asiakassopimuksen omistaja.
    if  (body.businessContract !== undefined && res.locals.decoded.id.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({message: "Agency was not right owner of BusinessContract."})
    }
    const index: IBusinessDocument[] = await Business.find({_id: userId})
    //Tarkistetaan että löytyykö Yritys jonka kanssa halutaan tehdä Asiakassopimus.
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty jo yrityssopimus.
      if (index[0].businessContracts.includes(businessContractId)) { 
        //Lähetetään vastausteksti missä kerrotaan että Yritys löytyy jo sopimuksesta.
        return res.status(400).send({message: "Business was already in contract."})
      //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        body.businessContractUpdate = {
          $addToSet: {
            'pendingContracts.businesses': {businessId: userId, formId:formId}
          }
        }
        body.businessContractUpdateFilterQuery = {_id: businessContractId}
        await Business.updateOne({_id:userId},{ $addToSet: { forms: formId, businessContracts: businessContractId  }})
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({_id: userId})
      //Tarkistetaan onko Työntekijän kanssa tehty jo yrityssopimus.
      if (index.length == 1) {
        if (index[0].businessContracts.includes(businessContractId)) {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä löytyy jo sopimuksesta.
          return res.status(400).send({message: "Worker was already in contract."})
        //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          body.businessContractUpdate = {
            $addToSet: {
              'pendingContracts.workers': {workerId: userId, formId:formId}
            }
          }
          body.businessContractUpdateFilterQuery = {_id: businessContractId}
          await Worker.updateOne({_id:userId},{ $addToSet: { forms: formId, businessContracts: businessContractId }})
        }
      } else {
        return res.status(404).send({message: "Couldn't find user who matches" + userId})
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body, params} = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(params.userId)
  } catch (exception) {
    return res.status(403).send({message: "Note: businessContractId and userId must be string."})
  }
  try {
    //Aluksi tarkistetaan että Agency on Asiakassopimuksen omistaja.
    if  (body.businessContract !== undefined && res.locals.decoded.id.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({message: "Agency was not right owner of BusinessContract."})
    }
    const index: IBusinessDocument[] = await Business.find({_id: userId})
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty asiakassopimus.
      if (index[0].businessContracts.includes(businessContractId)) { 
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.businesses': {businessId:userId},
            'pendingContracts.businesses': {businessId:userId},
          }
        }
        body.businessContractUpdateFilterQuery = {_id: businessContractId}
        await Business.updateOne({_id:userId},{ $pull: { businessContracts: businessContractId }})
      //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        //Lähetetään vastausteksti missä kerrotaan että Yritys ei löytynyt sopimuksesta.
        return res.status(400).send({message: "Business was not in contract."})
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({_id: userId})
      if (index.length == 1) {
        //Tarkistetaan onko Työntekijän kanssa tehty asiakassopimus.
        if (index[0].businessContracts.includes(businessContractId)) {
          body.businessContractUpdate = {
            $pull: {
              'requestContracts.workers': {businessId:userId},
              'pendingContracts.workers': {businessId:userId}
            }
          }
          body.businessContractUpdateFilterQuery = {_id: businessContractId}
          await Worker.updateOne({_id:userId},{$pull: { businessContracts: businessContractId }})
        //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä ei löytynyt sopimuksesta.
          return res.status(400).send({message: "Worker was already in contract."})
        }
      } else {
        return res.status(404).send({message: "Couldn't find user who matches" + userId})
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body, params} = req
  let id: Types.ObjectId
  try {
    id = Types.ObjectId(params.contractId)
  } catch (exception) {
    return res.status(403).send({message: "Note: contractId must be string."})
  }
  try {
    const updateFields = body.businessContractUpdate
    return BusinessContract.findOneAndUpdate(body.businessContractUpdateFilterQuery,
      updateFields,
      {new:true, lean: true},
      (error: CallbackError, rawResult:  DocumentDefinition<IBusinessContractDocument> | null) => {
        if (error) {
          return res.status(500).send(error.message)
        } else if (!rawResult) {
          return res.status(400).send({success: false, error: "Could not update BusinessContract with id " + id})
        } else {
          return res.status(200).send(rawResult)
        }
      })
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body, params} = req
  let id: Types.ObjectId
  const populatePath = 'madeContracts.businesses.businessId madeContracts.workers.businessId requestContracts.businesses.businessId '
  +'requestContracts.workers.businessId pendingContracts.workers.businessId pendingContracts.businesses.businessId'
  const populateFields = 'name email createdAt userType'
  try {
    id = Types.ObjectId(params.contractId)
  } catch (exception) {
    return res.status(403).send({message: "Note: contractId must be string."})
  }
  try {
    const updateFields = body.businessContractUpdate
    return BusinessContract.findOneAndUpdate(body.businessContractUpdateFilterQuery,
      updateFields,
      {new:true, lean: true}).populate(populatePath,populateFields).exec(
        (error: CallbackError, rawResult:  DocumentDefinition<IBusinessContractDocument> | null) => {
        if (error) {
          return res.status(500).send(error.message)
        } else if (!rawResult) {
          return res.status(400).send({success: false, error: "Could not update BusinessContract with id " + id})
        } else {
          return res.status(200).send(rawResult) 
        }
      })
  } catch (exception) {
    return res.status(500).send({exception})
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
  const {body,params} = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(res.locals.decoded.id)
    formId = Types.ObjectId(body.form)
  } catch (exception) {
    return res.status(403).send({message: "ContractId must be string."})
  }
  try {
    const index: IBusinessDocument[] = await Business.find({_id: userId})
    if (index.length == 1) {
      body.businessContractUpdate = {
        $pull: {
          'pendingContracts.businesses': { businessId: userId } 
        },
        $addToSet: {
          'requestContracts.businesses': {businessId: userId, formId:formId}
        }
      }
      body.businessContractUpdateFilterQuery = {_id: businessContractId}
    } else {
      const index: IWorkerDocument[] = await Worker.find({_id: userId})
      if (index.length == 1) {
        body.businessContractUpdate = {
          $pull: {
            'pendingContracts.workers': { workerId: userId }
          },
          $addToSet: {
            'requestContracts.workers': {workerId: userId, formId:formId}
          }
        }
        body.businessContractUpdateFilterQuery = {_id: businessContractId}
      } else {
        return res.status(404).send({message: "Couldn't find user who matches" + userId})
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
  }
}
/**
 * This middleware function is used to initialize BusinessContract update,
 * removes id from pendingContracts array. Used in routes that accept Worker or Business.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @returns {NextFunction} next
 */
export const initBusinessContractDeclineUpdate = async (req:Request<ParamsDictionary,unknown,IBaseBody>, res: Response, next: NextFunction) => {
  const {body,params} = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(res.locals.decoded.id)
  } catch (exception) {
    return res.status(403).send({message: "ContractId must be string."})
  }
  try {
    const index: IBusinessDocument[] = await Business.find({_id: userId})
    if (index.length == 1) {
      body.businessContractUpdate = {
        $pull: {
          'pendingContracts.businesses': { businessId: userId } 
        }
      }
      body.businessContractUpdateFilterQuery = {_id: businessContractId}
      await Business.updateOne({_id:userId},{$pull: { businessContracts: businessContractId }})
    } else {
      const index: IWorkerDocument[] = await Worker.find({_id: userId})
      if (index.length == 1) {
        body.businessContractUpdate = {
          $pull: {
            'pendingContracts.workers': { workerId: userId }
          }
        }
        body.businessContractUpdateFilterQuery = {_id: businessContractId}
        await Worker.updateOne({_id:userId},{$pull: { businessContracts: businessContractId }})
      } else {
        return res.status(404).send({message: "Couldn't find user who matches" + userId})
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
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
export const initBusinessContractAcceptUpdate = async (req:Request<ParamsDictionary,unknown,IBaseBody>,res:Response,next:NextFunction) => {
  const {body,params} = req
  let businessContractId: Types.ObjectId
  let userId: Types.ObjectId
  let formId: Types.ObjectId
  try {
    businessContractId = Types.ObjectId(params.businessContractId)
    userId = Types.ObjectId(params.userId)
    formId = Types.ObjectId(body.form)
  } catch (exception) {
    return res.status(403).send({message:"ContractId must be string."})
  }
  try {
    //Aluksi tarkistetaan että Agency on Asiakassopimuksen omistaja.
    if  (body.businessContract !== undefined && res.locals.decoded.id.toString() !== body.businessContract.agency.toString()) {
      return res.status(401).send({message: "Agency was not right owner of BusinessContract."})
    }
    const index: IBusinessDocument[] = await Business.find({_id: userId})
    if (index.length == 1) {
      //Tarkistetaan onko Yrityksen kanssa tehty asiakassopimus.
      if (index[0].businessContracts.includes(businessContractId)) { 
        body.businessContractUpdate = {
          $pull: {
            'requestContracts.businesses': {businessId:userId}
          },
          $addToSet: {
            'madeContracts.workers': {businessId:userId, formId:formId}
          }
        }
        body.businessContractUpdateFilterQuery = {_id: businessContractId}
      //Jos ei ole tehty suoritetaan elsen osio.
      } else {
        //Lähetetään vastausteksti missä kerrotaan että Yritys ei löytynyt sopimuksesta.
        return res.status(400).send({message: "Business was not in contract."})
      }
    } else {
      const index: IWorkerDocument[] = await Worker.find({_id: userId})
      if (index.length == 1) {
        //Tarkistetaan onko Työntekijän kanssa tehty asiakassopimus.
        if (index[0].businessContracts.includes(businessContractId)) {
          body.businessContractUpdate = {
            $pull: {
              'requestContracts.workers': {businessId:userId}
            },
            $addToSet: {
              'madeContracts.workers': {businessId:userId, formId:formId}
            }
          }
          body.businessContractUpdateFilterQuery = {_id: businessContractId}
        //Jos ei ole tehty suoritetaan elsen osio.
        } else {
          //Lähetetään vastausteksti missä kerrotaan että Työntekijä ei löytynyt sopimuksesta.
          return res.status(400).send({message: "Worker was already in contract."})
        }
      } else {
        return res.status(404).send({message: "Couldn't find user who matches" + userId})
      }
    }
    return next()
  } catch (exception) {
    return res.status(500).send({exception})
  }
} 
export default {}