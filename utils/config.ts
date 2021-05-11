require("dotenv").config()

let IP = process.env.IP
let PORT = process.env.PORT
let MONGODB_URI = process.env.MONGODB_URI

if (process.env.NODE_ENV === "test") {
  MONGODB_URI = process.env.TEST_MONGODB_URI
}

export default {
  MONGODB_URI,
  PORT,
  IP
}