const businesscontractsRouter = require("express").Router()
const authenticateToken = require("../utils/auhenticateToken")
const BusinessContract = require("../models/BusinessContract")
const { needsToBeBusiness, businessContractExists } = require("../utils/middleware")

const businessContractsApiPath = "api/businesscontracts/"

/**
 * Route for a Business to accept a BusinessContract created by an Agency
 * businessContractId is read from url param and the matching BusinessContract is put to request.businessContract
 * businessId is read from jwt-token and needsToBeBusiness middleware puts the matching Business object to request.business
 */
businesscontractsRouter.put("/:businessContractId", authenticateToken, businessContractExists, needsToBeBusiness, async (request, response, next) => {
  try {
    if (request.businessContract.business.toString() !== request.business._id.toString()) {
      return response
        .status(401)
        .json({ message: "Business with ID " + request.business._id + " not authorized to accept this BusinessContract. Required: " + request.businessContract.business })
    } else {
      BusinessContract.findByIdAndUpdate(request.businessContract._id, { contractMade: true },
        { new: true }, (error, result) => {
          if (error || !result) {
            return response
              .status(400)
              .send(error || { message: "Could not find and update BusinessContract with ID " + request.businessContract._id })
          } else {
            response
              .header({ Location: businessContractsApiPath + request.businessContract._id })
              .status(200)
              .json({ success: true })
          }
        })
    }
  } catch (exception) {
    next(exception)
  }
})

module.exports = businesscontractsRouter