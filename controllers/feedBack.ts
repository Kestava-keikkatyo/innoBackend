import express from "express"
import authenticateToken from "../utils/auhenticateToken"
import { postFeedBackDocument, getFeedBackDocuments, putReplyToFeedBackDocument } from "../utils/feedBackMiddleware"
import { needsToBeAgencyBusinessOrWorker } from "../utils/middleware"

const feedBackRouter = express.Router()
/**
 * Käytetään kun halutaan hakea käyttäjän palaute.
 */
feedBackRouter.get("/get", authenticateToken, needsToBeAgencyBusinessOrWorker, getFeedBackDocuments)
/**
 * Käytetään kun käyttäjä antaa palautetta.
 */
feedBackRouter.post("/post", authenticateToken, needsToBeAgencyBusinessOrWorker, postFeedBackDocument)
/**
 * Käytetään kun halutaan vastata käyttäjän antamaan palautteeseen.
 */
feedBackRouter.put("/reply", putReplyToFeedBackDocument)

export default feedBackRouter