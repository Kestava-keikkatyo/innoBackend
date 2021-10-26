import { NextFunction, Request, Response } from "express"
import { CallbackError, DocumentDefinition } from "mongoose"
import Agency from "../models/Agency"
import JobVacancy from "../models/JobVacancy"
import { IAgencyDocument, IJobVacancyDocument } from "../objecttypes/modelTypes"

/**
 * This middleware function is used to post a new job vacancy.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns New job vacancy document
 */
export const postJobVacancyDocument = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { body } = req

        const jobVacancyDocument: IJobVacancyDocument = new JobVacancy({
            agencyId: res.locals.decoded.id,
            jobTitle: body.jobTitle,
            jobCategory: body.jobCategory,
            details: body.details,
            requirements: body.requirements,
            numberOfNeededWorkers: body.numberOfNeededWorkers,
            startingDate: body.startingDate,
            endingDate: body.endingDate,
            applyingEndsAt: body.applyingEndsAt,
            streetAddress: body.streetAddress,
            zipCode: body.zipCode,
            city: body.city
        })

        return jobVacancyDocument.save((error: CallbackError, result: IJobVacancyDocument) => {
            if (error) {
                return res.status(500).json({ message: error.message })
            }
            if (!result) {
                return res.status(500).json({ message: "Unable to save job vacancy" })
            }
            return addJobVacancyToAgency(res.locals.decoded.id, result, res, next)
        })

    } catch (exception) {
        return next(exception)
    }
}

/**
* Helper function for adding a job vacancy to agency's jobVacancies array
* @param agencyId - id of the agency in question
* @param jobVacancy - the job vacancy that we are adding to the agency's jobVacancies array
* @param res - Response
* @param next - NextFunction
*/
const addJobVacancyToAgency = (agencyId: string, jobVacancy: IJobVacancyDocument, res: Response, next: NextFunction) => {

    try {
        Agency.findByIdAndUpdate(
            agencyId,
            { $addToSet: { jobVacancies: jobVacancy } },
            { new: true, omitUndefined: true, runValidators: true, lean: true },
            (error: CallbackError, result: IAgencyDocument | null) => {
                if (error || !result) {
                    return res.status(500).send(error || { message: "Received no result when updating user" })
                } else {
                    return res.status(200).send(jobVacancy)
                }
            })

    } catch (exception) {
        return next(exception)
    }
}


/**
 * This middleware function is used to get all job vacancies.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns All job vacancies
 */
export const getJobVacancyDocuments = (_req: Request, res: Response, next: NextFunction) => {
    try {

        JobVacancy.find({}, (error: CallbackError, docs: IJobVacancyDocument[]) => {
            if (error) {
                return res.status(500).json({ message: error.message })
            }
            if (!docs.length) {
                return res.status(404).json({ message: "Job vacancies not found!" })
            }
            return res.status(200).json(docs)

        })


    } catch (exception) {
        return next(exception)
    }
}


/**
 * This middleware function is used to get agency's own job vacancies.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Agency's job vacancies
 */
export const getJobVacancyDocumentsForAgency = (_req: Request, res: Response, next: NextFunction) => {
    try {

        JobVacancy.find({ agencyId: res.locals.decoded.id }, (error: CallbackError, docs: IJobVacancyDocument[]) => {
            if (error) {
                return res.status(500).json({ message: error.message })
            }
            if (!docs.length) {
                return res.status(404).json({ message: "Job vacancies not found!" })
            }
            return res.status(200).json(docs)

        })

    } catch (exception) {
        return next(exception)
    }
}


/**
 * This middleware function is used to get job vacancy by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Job vacancy
 */
export const getJobVacancyDocumentById = (req: Request, res: Response, next: NextFunction) => {
    const { params } = req
    const id: string = params.id

    try {

        JobVacancy.findById(id, (error: CallbackError, doc: IJobVacancyDocument | null) => {

            if (error) {
                return res.status(500).json({ message: error.message })
            }
            if (!doc) {
                return res.status(404).send({ message: `Could not find job vacancy with ID ${id}` })
            }
            return res.status(200).send(doc)
        })

    } catch (exception) {
        return next(exception)
    }
}


/**
 * This middleware function is used to update job vacancy by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated job vacancy
 */
export const updateJobVacancyDocument = async (req: Request, res: Response, next: NextFunction) => {

    const { params, body } = req

    try {
        const id: string = params.id

        console.log("id", id)
        console.log("body", body)

        const jobVacancy: IJobVacancyDocument | null = await JobVacancy.findOne({ _id: id })
        console.log("jobVacancy", jobVacancy)

        if (!jobVacancy) {
            return res.status(404).send({ message: `Could not find job vacancy with ID ${id}` })
        }

        JobVacancy.findByIdAndUpdate(id,
            { ...body },
            { new: true, runValidators: true, lean: true },
            (error: CallbackError, updatedDoc: IJobVacancyDocument | null) => {
                if (error) {
                    return res.status(500).json({ message: error.message })
                }
                if (!updatedDoc) {
                    return res.status(500).send({ message: "Didn't get a result from database while updating job vacancy" })
                }
                return res.status(200).send(updatedDoc)
            })

    } catch (exception) {
        return next(exception)
    }
}


/**
 * This middleware function is used to delete job vacancy by id.
 * @param {Request} req - Express Request.
 * @param {Response} res - Express Response.
 * @param {NextFunction} next
 * @returns Updated job vacancy
 */
export const deleteJobVacancyDocument = async (req: Request, res: Response, next: NextFunction) => {

    const { params } = req

    try {
        const id: string = params.id

        const jobVacancy: IJobVacancyDocument | null = await JobVacancy.findOne({ _id: id })

        if (!jobVacancy) {
            return res.status(404).send({ message: `Could not find job vacancy with ID ${id}` })
        }

        JobVacancy.findByIdAndDelete(id, { lean: true }, (error: CallbackError, result: IJobVacancyDocument | null) => {
            if (error) {
                return res.status(500).json({ message: error.message })
            }
            // result = deleted document
            if (!result) {
                return res.status(500).send({ message: "Didn't get a result from database while deleting job vacancy" })
            }
            return Agency.findByIdAndUpdate(
                result.agencyId,
                { $pull: { jobVacancies: { $in: [result._id] } } },
                { lean: true },
                async (error: CallbackError, agencyResult: DocumentDefinition<IAgencyDocument> | null) => {
                    if (error || !agencyResult) {
                        return res.status(500).send(error || { message: "Did not receive any result from database when deleting business contract form's id from array" })
                    }
                    return res.status(204).send()

                }
            )

        })


    } catch (exception) {
        return next(exception)
    }
}