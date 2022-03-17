const admin = require("../models/adminauth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const JWT_SECRET = process.env.jwt;

const verifyAdminToken = (token) => {
  try {
    const verify = jwt.verify(token, JWT_SECRET);
    if (verify.type === "admin") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(JSON.stringify(error), "error");
    return false;
  }
};

const verifyAdminLogin = async (email, password) => {
  try {
    const Admin = await admin.findOne({ email }).lean();
    console.log(Admin);
    if (!admin) {
      return { status: "error", error: "user not found" };
    }
    if (await bcrypt.compare(password, Admin.password)) {
      // creating a token
      token = jwt.sign(
        { id: Admin._id, username: Admin.email, type: "admin" },
        JWT_SECRET,
        { expiresIn: 60 * 60 * 5 }
      );
      return { status: "ok", data: token };
    }
    return { status: "error", error: "invalid password" };
  } catch (error) {
    return { status: "error", error: "timed out" };
  }
};

const verifyAdminMiddleware = (req, res, next) => {
  try {
    console.log("query is ", req.originalUrl);
    if (req.originalUrl === "/admin/login") {
      return next();
    }
    if (req.cookies.token) {
      const verify = jwt.verify(req.cookies.token, JWT_SECRET);
      console.log("verify is ", verify.username);
      if (verify.type === "admin") {
        return next();
      }
    }
    return res.redirect("/admin/login");
  } catch (error) {
    console.log(JSON.stringify(error), "error");
  }
};

module.exports = { verifyAdminToken, verifyAdminLogin, verifyAdminMiddleware };
