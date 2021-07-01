import express from 'express'
import authenticateToken from '../utils/auhenticateToken'
import { needsToBeAgencyBusinessOrWorker } from '../utils/middleware'
import { postNotificationDocument, sendTextToNotificationsDocument, getNotificationsDocument, textReadNotificationsDocument, clearAllNotificationsDocument } from '../utils/notificationsMiddleware'

const notificationsRouter = express.Router()
/**
 * Käytetään kun käyttäjä ensimmäisen kerran rekistöröityy sovellukseen.
 */
notificationsRouter.post("/post",authenticateToken,needsToBeAgencyBusinessOrWorker,postNotificationDocument)
/**
 * Käytetään kun käyttäjälle halutaan tehdä ilmoitus.
 */
notificationsRouter.put("/:userId/update",authenticateToken,needsToBeAgencyBusinessOrWorker,sendTextToNotificationsDocument)
/**
 * Käytetään kun halutaan hakea käyttäjän ilmoitukset, haun jälkeen ilmoitukset näytetään 
 * kelloiconissa käyttöliittymältä.
 */
notificationsRouter.get("/get",authenticateToken,needsToBeAgencyBusinessOrWorker,getNotificationsDocument)
/**
 * Käytetään kun käyttäjä näkee ilmoituksen ja klikkaa sitä. Ilmoitus merkataan tämän jälkeen luetuksi.
 */
notificationsRouter.put("/:textId/read",authenticateToken,needsToBeAgencyBusinessOrWorker,textReadNotificationsDocument)
/**
 * Käytetään kun käyttäjä painaa kaikki ilmoitukset luetuiksi.
 */
notificationsRouter.put("/clearAll",authenticateToken,needsToBeAgencyBusinessOrWorker,clearAllNotificationsDocument)

export default notificationsRouter