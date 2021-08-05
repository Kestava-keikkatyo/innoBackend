import { CallbackError } from 'mongoose';
import { IReportDocument } from './../objecttypes/modelTypes';

import express, { NextFunction, Request, Response } from "express"
import authenticateToken from '../utils/auhenticateToken'

import { needsToBeAgencyOrBusiness, needsToBeWorker } from './../utils/middleware';
import Report from '../models/Report';


const reportsRouter = express.Router()

/**
 * @openapi
 * /reports:
 *   post:
 *     summary: Route for workers to post a new report to the relevant business/agency or both of them.
 *     description: Must be logged in as a worker
 *     tags: [Worker, Reports]
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
 *             $ref: "#/components/schemas/Report"
 *     responses:
 *       "200":
 *         description: Report added. Returns added report object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *       "502":
 *         description: Unable to save the report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Unable to save the report
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: "Report validation failed: workTitle: Path `workTitle` is required. | Internal server error."
 */
reportsRouter.post("/", authenticateToken, needsToBeWorker, (req: Request, res: Response, next: NextFunction) => {

    try {
        const { body } = req
        const newReport: IReportDocument = new Report({
            workerId: res.locals.decoded.id,
            workTitle: body.workTitle,
            reportTitle: body.reportTitle,
            details: body.details,
            date: body.date,
            businessAsHandler: body.businessAsHandler,
            agencyAsHandler: body.agencyAsHandler,
            fileUrl: body.fileUrl
        })

        newReport.save((error: CallbackError, doc: IReportDocument) => {
            if (error) {
                return res.status(500).json({ message: error.message })
            }
            if (!doc) {
                return res.status(502).json({ message: "Unable to save the report" })
            }
            return res.status(200).json(doc)
        })

    } catch (exception) {
        return next(exception)

    }

})

/**
 * @openapi
 * /reports:
 *   get:
 *     summary: Route for businesses and agencies to get the reports that sent to them.
 *     description: Must be logged in as a business or agency
 *     tags: [Agency, Business, Reports]
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         description: The token you get when logging in is used here. Used to authenticate the user.
 *         required: true
 *         schema:
 *           $ref: "#/components/schemas/AccessToken"
 *     responses:
 *       "200":
 *         description: Returns the reports that sent to the business/agency
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Report"
 *             example:
 *                  [
 *                    {
 *                      _id: 6108249105016248ed842e8d,
 *                      workerId: 60ba06c2399be77d6ca52e8b,
 *                      workTitle: Keikka 1,
 *                      reportTitle: Report 1,
 *                      details: Report details,
 *                      date: "3/8/2021, 12:28:33",
 *                      businessAsHandler: 60f2920924c21408a707e22d,
 *                      agencyAsHandler: 60b4ea97628f2f36480f5d25,
 *                      fileUrl: https://keikkakaveri-uploads-bucket.s3.eu-central-1.amazonaws.com/images/a08cff83-e058-4ced-a725-602db4b51a6d-water-3226_1920.jpg
 *                     }
 *                   ]
 *       "404":
 *         description: Reports not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *             example:
 *               message: Reports not found for this business/agency
 *       "500":
 *         description: An error occurred when calling the database.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
reportsRouter.get("/", authenticateToken, needsToBeAgencyOrBusiness, (_req: Request, res: Response, next: NextFunction) => {
    try {
        const userType = res.locals.decoded.role
        if (userType === "agency") {
            const agencyId = res.locals.decoded.id
            Report.find({ agencyAsHandler: agencyId }, (error: CallbackError, result: IReportDocument[]) => {
                if (error) {
                    return res.status(500).json({ message: error.message })
                }
                if (!result.length) {
                    return res.status(404).json({ message: "Reports not found for this agency!" })
                }
                return res.status(200).json(result)

            })

        } else if (userType === "business") {
            const businessId = res.locals.decoded.id
            Report.find({ businessAsHandler: businessId }, (error: CallbackError, result: IReportDocument[]) => {
                if (error) {
                    return res.status(500).json({ message: error.message })
                }
                if (!result.length) {
                    return res.status(404).json({ message: "Reports not found for this business!" })
                }
                return res.status(200).json(result)

            })
        }


    } catch (exception) {
        return next(exception)
    }

})


export default reportsRouter