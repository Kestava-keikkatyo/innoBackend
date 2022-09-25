import bcrypt from "bcryptjs";
import data from "./data.json";
import config from "../utils/config";
import logger from "../utils/logger";
import mongoose from "mongoose";
import User from "../models/User";

const getUserSchema = (user: any, hash: any) =>
  new User({
    name: user.name,
    userType: user.userType,
    email: user.email,
    passwordHash: hash,
  });

const createUser = async (user: { email: string; name: string; password: string; userType?: string }) => {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(user.password, saltRounds);
  await getUserSchema(user, passwordHash).save();
};
if (config.MONGODB_URI) {
  mongoose
    .connect(config.MONGODB_URI, {})
    .then(() => {
      logger.info("connected to MongoDB");
    })
    .catch((error) => {
      logger.error("error connection to MongoDB:", error.message);
    });
}

/**
 * TODO: Käyttäjien luomisen jälkeen halutaan disconnectaa
 */
data.user.map((u) => createUser(u));

// Promise.all(res).then(() => {
//   logger.info("Database seeded. Disconnecting...")
//   mongoose.disconnect()
// })
