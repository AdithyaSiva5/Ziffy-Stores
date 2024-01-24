const userCollection = require("../models/user_schema");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
require("dotenv").config();

module.exports.verifyUser = (req,res,next)=>{
    const token = req.cookies.token;
    const verifyToken = jwt.verify(token, process.env.JWT_KEY,(err,decoded)=>{
        if(err){
            return res.redirect("/login")
        }
        req.user = decoded;
        next();
    });

}

module.exports.checkBlockedStatus = async (req, res, next) => {
  try {
    const emailId = req.user;
    const user = await userCollection.findOne({email : emailId});

    if (user.status === "Block") {
      res.clearCookie("token");
      res.clearCookie("loggedIn");
      return res.status(403).render("user-login", { subreddit: "Your account has been blocked" });
    }

    next();
  } catch (error) {
    console.log(error);
    next(error);  
  }
};
