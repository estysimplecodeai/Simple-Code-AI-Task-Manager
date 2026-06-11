const mongoose = require("mongoose");
const config = require("./config");

async function connectDb(uri = config.mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDb };
