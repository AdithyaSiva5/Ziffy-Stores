const userCollection = require('../../models/user_schema')
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require('dotenv').config();
const jwt = require("jsonwebtoken")
secretkey = process.env.JWT_KEY;

//getting login page
module.exports.getLogin=(req,res)=>{
    if (req.cookies.loggedIn) {
      res.redirect("/");
    } else {
      res.render("user-login");
    }
}

module.exports.postLogin = async(req,res)=>{

    const logindata = await userCollection.findOne({ email : req.body.email});
    password = req.body.password;
    if(!logindata){
        res.status(200).json({ error : "Email is not Registered"});
    } else if (logindata){
          const passwordMatch = await bcrypt.compare(
            password,
            logindata.password
          );
        if(logindata.status === "Block"){
            res.status(200).json({error : "User is Blocked"})
        }else if (!passwordMatch) {
          res.status(200).json({ error: "Incorrect Password" });
        } else {
          if (
            req.body.email === logindata.email
          ) {
            try {
              email = req.body.email;
              const token = jwt.sign(email, secretkey);
              res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000 });
              res.cookie("loggedIn", token, { maxAge: 24 * 60 * 60 * 1000 });
              res.status(200).json({ success: true });
            } catch (error) {
              console.log(error);
              res.send(500).json({ error: "Internal server error" });
            }
          } else {
            res.send(200).json({ error: "Invalid Credentials" });
          }
        }
    }
}