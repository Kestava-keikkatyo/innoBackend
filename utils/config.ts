require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const IP = process.env.IP;
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV;

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_BUCKET = process.env.AWS_BUCKET;

const DB_FIRST_ADMIN_PASSWORD = process.env.DB_FIRST_ADMIN_PASSWORD;
const DB_FIRST_ADMIN_EMAIL = process.env.DB_FIRST_ADMIN_EMAIL;

export default {
  MONGODB_URI,
  PORT,
  IP,
  NODE_ENV,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET,
  DB_FIRST_ADMIN_PASSWORD,
  DB_FIRST_ADMIN_EMAIL,
};
