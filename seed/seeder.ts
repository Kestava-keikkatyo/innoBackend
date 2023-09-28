import bcrypt from "bcryptjs";
import data from "./data.json";
import config from "../utils/config";
import logger from "../utils/logger";
import mongoose from "mongoose";
import User from "../models/User";

const createUser = async (user: {
  firstName: string;
  lastName: string;
  userType: string;
  password: string;
  email: string;
}) => {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(user.password, saltRounds);
  await new User({ ...user, passwordHash }).save();
};

if (!config.MONGODB_URI) {
  throw new Error("Database url missing");
}
mongoose.connect(config.MONGODB_URI, (err) => {
  throw err;
});

mongoose.connection.on("connected", async () => {
  try {
    await Promise.all(data.users.map((u) => createUser(u)));
  } catch (error) {
    logger.error("Error seeding the database:", error);
  }
  logger.info("Seeding completed successfully.");
  mongoose.disconnect();
});
