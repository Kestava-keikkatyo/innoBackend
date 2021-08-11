import { NextFunction, Request, Response } from "express"
import { CallbackError } from "mongoose"
import Worker from "../models/Worker"
import Business from "../models/Business"
import Agency from "../models/Agency"
import Notifications from "../models/Notifications"
import { INotificationsDocument } from "../objecttypes/modelTypes"


export const postNotificationDocument = (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { body } = req
    const updateFilter = { _id: res.locals.decoded.id }
    let userType = ""
    const notificationDocument: INotificationsDocument = new Notifications({
      userId: res.locals.decoded.id,
      unread_messages: [],
      read_messages: []
    })

    if (body.worker && body.worker.notifications.length === 0) {
      userType = "Worker"
    }
    else if (body.business && body.business.notifications.length === 0) {
      userType = "Business"
    }
    else if (body.agency && body.agency.notifications.length === 0) {
      userType = "Agency"
    }
    else {
      return res.status(404).send({ message: "Couldn't find user and trace was not added." })
    }

    return notificationDocument.save((error: CallbackError, doc: INotificationsDocument) => {
      if (error) {
        return res.status(500).send(error)
      }
      else if (!doc) {
        return res.status(502).send({ message: "Save didn't return doc." })
      }
      else {
        const update = { $addToSet: { notifications: doc._id } }
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
    return res.status(500).send(exception)
  }
}

export const sendTextToNotificationsDocument = (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { body, params } = req
    const updateFilter = { userId: params.userId }
    const update: {} = { $addToSet: { unread_messages: { text: body.notificationMessage } } }

    return Notifications.updateOne(updateFilter, update, undefined, (err: CallbackError, result: any) => {
      if (err) {
        return res.status(500).send({ error: err.message })
      }
      else if (!result) {
        return res.status(502).send({ message: "Query didn't return result." })
      }
      else {
        return res.status(200).send(result)
      }
    })

  } catch (exception) {
    return res.status(500).send(exception)
  }
}


export const getNotificationsDocument = (_req: Request, res: Response, _next: NextFunction) => {
  try {
    //const { body } = req
    const getFilter = { userId: res.locals.decoded.id }

    return Notifications.findOne(getFilter).then(
      result => {
        if (!result) {
          return res.status(404).send({ message: "Couldn't find notification documents for user." })
        } else {
          return res.status(200).send(result)
        }
      }
    ).catch(err => { return res.status(404).send({ error: err, message: "Fatal error occured." }) })

  } catch (exception) {
    return res.status(500).send(exception)
  }
}

export const textReadNotificationsDocument = (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { body,params } = req
    const updateFilter: {} = { userId: res.locals.decoded.id, unread_messages: { $elemMatch: { _id: params.textId } } }
    const update: {} = {
      $pull: {
        'unread_messages': { text: body.text }
      },
      $addToSet: {
        'read_messages': { text: body.text }
      }
    }


    return Notifications.findOneAndUpdate(updateFilter, update, { lean: true }, (err: CallbackError, result: any) => {
      if (err) {
        return res.status(500).send({ error: err.message })
      }
      else if (!result) {
        return res.status(502).send({ message: "Query didn't return result." })
      }
      else {
        return res.status(200).send(result)
      }
    })

  } catch (exception) {
    return res.status(500).send(exception)
  }
}

export const clearAllNotificationsDocument = (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { body } = req
    const array:[] = body.clearAllArray
    const updateFilter: {} = { userId: res.locals.decoded.id }
    const update:{} = {
      $pullAll: {
        unread_messages: array 
      },
      $addToSet: {
        read_messages: {$each: array}
      }
    }
    return Notifications.findOneAndUpdate(updateFilter, update, { lean: true, new: true }, (err: CallbackError, result: any) => {
      if (err) {
        return res.status(500).send({ error: err.message })
      }
      else if (!result) {
        return res.status(502).send({ message: "Query didn't return result." })
      }
      else {
        return res.status(200).send(result)
      }
    })
  } catch (exception) {
    return res.status(500).send(exception)
  }
}



export default {}