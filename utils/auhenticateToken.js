const jwt = require('jsonwebtoken')
require('dotenv').config()

//Tarkistetaan onko Tokeania annettu ja onko se oikea Tokeni
module.exports = (request, response, next) => {
  const token = request.headers['x-access-token']
  if (!token)
    return response
      .status(401)
      .send({ auth: false, message: 'No token provided.' })

  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if (err) {
      return response
        .status(500)
        .send({ auth: false, message: 'Failed to authenticate token.' })
    } else {
      response.locals.decoded = decoded
      next()
    }
  })
}
