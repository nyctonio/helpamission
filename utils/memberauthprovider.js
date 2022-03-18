const member = require("../models/memberauth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const JWT_SECRET = process.env.jwt;

const verifyMemberToken = (token) => {
  try {
    const verify = jwt.verify(token, JWT_SECRET);
    if (verify.type === "member") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(JSON.stringify(error), "error");
    return false;
  }
};

const verifyMemberLogin = async (email, password) => {
  try {
    const user = await member.findOne({ email }).lean();
    if (!user) {
      return { status: "error", error: "user not found" };
    }
    if (await bcrypt.compare(password, user.password)) {
      // creating a token
      token = jwt.sign(
        { id: user._id, username: user.email, type: "member" },
        JWT_SECRET,
        { expiresIn: 60 * 60 * 5 }
      );
      return { status: "ok", data: token };
    }
    return { status: "error", error: "invalid password" };
  } catch (error) {
    console.log(error);
    return { status: "error", error: "timed out" };
  }
};
const verifyMemberMiddleware = (req, res, next) => {
  try {
    console.log("query is ", req.originalUrl);
    if (req.originalUrl === "/member/login") {
      return next();
    }
    if (req.cookies.token) {
      const verify = jwt.verify(req.cookies.token, JWT_SECRET);
      console.log("verify is ", verify.username);
      if (verify.type === "member" || verify.type === "admin") {
        return next();
      }
    }
    return res.redirect("/member/login");
  } catch (error) {
    console.log(JSON.stringify(error), "error");
    return res.redirect("/member/login");
  }
};

module.exports = {
  verifyMemberToken,
  verifyMemberLogin,
  verifyMemberMiddleware,
};
