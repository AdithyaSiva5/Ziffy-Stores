const adminCollection = require("../models/admin_schema");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
require("dotenv").config();

module.exports.verifyAdmin = (req, res, next) => {
  const admintoken = req.cookies.admintoken;
  const verifyToken = jwt.verify(
    admintoken,
    process.env.ADMIN_JWT_KEY,
    (err, decoded) => { 
      if (err) {
        return res.redirect("/admin");
      }
      req.admin = decoded;
      next();
    }
  );
};
