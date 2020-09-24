const mongoose = require("mongoose");
var dotenv = require('dotenv');

dotenv.config();
var url = process.env.MONGODB_URI;

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true 
    });
    console.log("Connected to DB");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitiateMongoServer;
