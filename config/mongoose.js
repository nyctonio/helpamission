const mongoose = require("mongoose");
require("dotenv").config();
const mongourl = process.env.mongourl;
const config = {
  useNewUrlParser: true,
};
mongoose.connect(
  mongourl || "mongodb://localhost/helpamission",
  config,
  (err) => {
    if (err) {
      console.log("error in connecting to mongoose", err);
      return;
    }
    console.log("connected to mongoose");
  }
);
