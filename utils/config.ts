require("dotenv").config();

let IP = process.env.IP;
let PORT = process.env.PORT;
let MONGODB_URI = process.env.MONGODB_URI;
let NODE_ENV = process.env.NODE_ENV;

const IS_LOCAL_DATABASE = NODE_ENV === "test";

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_BUCKET = process.env.AWS_BUCKET;
const DB_FIRST_ADMIN_PASSWORD = process.env.DB_FIRST_ADMIN_PASSWORD;
const DB_FIRST_ADMIN_EMAIL = process.env.DB_FIRST_ADMIN_EMAIL;

if (NODE_ENV === "test") {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
}

export default {
  MONGODB_URI,
  PORT,
  IP,
  NODE_ENV,
  IS_LOCAL_DATABASE,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET,
  DB_FIRST_ADMIN_PASSWORD,
  DB_FIRST_ADMIN_EMAIL,
};
