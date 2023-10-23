import Token from "../models/Token";
import { IUserDocument } from "../objecttypes/modelTypes";
import crypto from "crypto";

function randomString(len: number) {
  return crypto.randomBytes(len).toString("hex");
}

const ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;

const createToken = async (user: IUserDocument) => {
  const token = randomString(32);
  await Token.create({
    token: token,
    user: user.id,
    lastUsedAt: new Date(),
  });
  return token;
};

const verify = async (token: string) => {
  const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILLIS);
  const tokenInDB = await Token.findOne({
    token: token,
    lastUsedAt: {
      $gt: oneWeekAgo,
    },
  });

  if (!tokenInDB) return null;

  tokenInDB.lastUsedAt = new Date();
  await tokenInDB.save();
  return tokenInDB.user;
};

const deleteToken = async (token: string) => {
  await Token.deleteOne({ token });
};

const scheduleCleanup = () => {
  setInterval(async () => {
    const oneWeekAgo = new Date(Date.now() - ONE_WEEK_IN_MILLIS);
    await Token.deleteOne({
      lastUsedAt: {
        $lt: oneWeekAgo,
      },
    });
  }, 60 * 60 * 1000);
};

const clearTokens = async (userId: string) => {
  await Token.deleteOne({ user: userId });
};

export default {
  createToken,
  verify,
  deleteToken,
  scheduleCleanup,
  clearTokens,
};
