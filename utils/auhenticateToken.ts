import jwt, {VerifyErrors} from "jsonwebtoken"
import {NextFunction, Request, Response} from "express";
require("dotenv").config()

//Tarkistetaan onko Tokeania annettu ja onko se oikea Tokeni
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token: string = req.headers["x-access-token"] as string
  if (!token)
    return res.status(401).send({ message: "No token provided." })

  return jwt.verify(token, process.env.SECRET || '', function (err: VerifyErrors | null, decoded: any) {
    if (err) {
      return res.status(500).send({ message: "Failed to authenticate token." })
    } else {
      res.locals.decoded = decoded
      return next()
    }
  })
}

export default authenticateToken