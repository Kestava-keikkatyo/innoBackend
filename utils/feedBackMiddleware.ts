import { NextFunction, Request, Response } from "express"
import { CallbackError } from "mongoose"
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"
import FeedBack from "../models/FeedBack"
import { IFeedBackDocument } from "../objecttypes/modelTypes"

/**
 * Käytetään kun halutaan tallentaa tietokantaan uusi palaute dokumentti.
 * Postaa uuden feedback dokumentin tietokantaan. Tämän jälkeen linkittää dokumentin
 * _id:n lisäämällä tämän käyttäjän dokumentissa olevaan feedback array listaan.  
 */
export const postFeedBackDocument = (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { body } = req 
    const updateFilter = { _id: res.locals.decoded.id }
    let userType = ""
    const feedBackDocument: IFeedBackDocument = new FeedBack({
      userId: res.locals.decoded.id,
      message: body.message
    })

    if (body.worker) {
      userType = "Worker"
    }
    else if (body.business) {
      userType = "Business"
    }
    else if (body.agency) {
      userType = "Agency"
    }
    else {
      return res.status(404).send({ message: "Couldn't find user and trace was not added." })
    }

    return feedBackDocument.save((error:CallbackError, doc: IFeedBackDocument) => {
      if (error) {
        return res.status(500).send(error)
      }
      else if (!doc) {
        return res.status(502).send({ message: "Save didn't return doc." })
      }
      else {
        const update = { $addToSet: { feedBack: doc._id } }
        switch (userType) {
          case "Agency":
            return Agency.findOneAndUpdate(updateFilter, update).then(
              doc => { return res.status(200).send(doc) })
              .catch(err => { return res.status(500).send({ error: err, message: "Fatal error occured." }) })
          case "Business":
            return Business.findOneAndUpdate(updateFilter, update).then(doc => {
              return res.status(200).send(doc)
            })
              .catch(err => { return res.status(500).send({ error: err, message: "Fatal error occured." }) })
          case "Worker":
            return Worker.findOneAndUpdate(updateFilter, update).then(doc => {
              return res.status(200).send(doc)
            })
              .catch(err => { return res.status(500).send({ error: err, message: "Fatal error occured." }) })
          default:
            return res.status(404).send({ message: "User was not Agency, Business or Worker." })
        }
      }
    })
  
  } catch (exception) {
    return res.status(500).send({exception})
  }
}

/**
 * Käytetään kun halutaan palauttaa kaikki käyttäjän feedback dokumenttit tietokannasta.
 * Hakee käyttäjän _id:n kautta feedback dokumentit.
 */
export const getFeedBackDocuments = (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const findFilter = {userId: res.locals.decoded.id}
    return FeedBack.find(findFilter,(err:CallbackError, docs: IFeedBackDocument[]) => {
      if (err) {
        return res.status(500).send({message:"Fatal error.", error:err})
      }
      else if (!docs) {
        return res.status(404).send({message:"Could not find any feedback documents for this user."})
      } 
      else {
        return res.status(200).send(docs)
      }
    })
  } catch (exception) {
    return res.status(500).send({exception})
  }
}

/**
 * Käytetään kun halutaan vastata käyttäjän antamaan palautteeseen.
 * Lisää FeedBack dokumentin kohtaan reply vastauksen.
 */
export const putReplyToFeedBackDocument = (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { body, params } = req
    const updateFilter = { _id: params.feedbackId }
    const update = { $set: { reply: body.replyMessage }}

    return FeedBack.updateOne(updateFilter,update,undefined,(err:CallbackError, res:any) => {
      if (err) return res.status(500).send({message:"Fatal error.", error:err})
      else if (!res) return res.status(404).send({message: "Feedback update result was empty."})
      else return res.status(200).send(res)
    })
    
  } catch (exception) {
    return res.status(500).send({exception})
  }
}

export default {}