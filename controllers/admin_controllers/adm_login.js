const mongoose = require("mongoose");
const multer = require("multer");
const adminCollection = require("../../models/admin_schema");
const jwt = require("jsonwebtoken");
const secretkey = process.env.ADMIN_JWT_KEY;
module.exports.getAdminLogin = (req, res) => {
  if (req.cookies.admintoken) {
    res.render("admin-dashboard");
  }else {
    res.render("admin-login");
  }
};

module.exports.getAdminDashboard = async (req, res) => {
  email = req.body.email;
  const admindata = await adminCollection.findOne({ email: req.body.email });
  if (!admindata) {
    return res.status(200).json({ error: "Email Incorrect" });
  } else {
    if (admindata) {
      if (req.body.password != admindata.password) {
        return res.status(200).json({ error: "Incorrect Password" });
      } else {
        if (
          req.body.email == admindata.email &&
          req.body.password == admindata.password
        ) {
          const admintoken = jwt.sign(email, secretkey);
          res.cookie("admintoken", admintoken, {
            maxAge: 24 * 60 * 60 * 1000,
          });
          res.cookie("loggedIn", admintoken, {
            maxAge: 24 * 60 * 60 * 1000,
          });
          return res.status(200).json({ message: "Login Successfully" });
        }
      }
    } else {
      res.redirect("/admin");
    }
  }
};
