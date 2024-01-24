const nodemailer = require("nodemailer");
const userCollection = require("../../models/user_schema");
const walletCollection = require("../../models/wallet_schema")
var randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const saltRounds = 10;
let generatedOTP;
let otpTimer;
module.exports.postUserSignup = async (req, res) => {
  try {

        generatedOTP = null;
        clearTimeout(otpTimer);

    const email = await userCollection.findOne({ email: req.body.email });
    const phoneNumber = await userCollection.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    const password = req.body.password;
    let codeId = randomstring.generate(12);


    if (email) {
      res.status(200).json({ error: "Email already Exist" });
    } else if (phoneNumber) {
      res.status(200).json({ error: "Phone Number Already Exists" });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          return;
        } 
        await userCollection.create({
          username: req.body.username,
          password: hash,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          status: "Unblock",
          referelId: codeId
        });
      const currUser = await userCollection.findOne({ email: req.body.email });
      await walletCollection.create({
        userId: currUser._id,
        amount: 0,
      });
        res.render("user-login", { message: "User sign up successfully" });
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, generatedOTP) => {
  try { 
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: {
        name: "Zify",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Account verification mail",
      text: `Your OTP for verification is: ${generatedOTP}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email has been sent: " + info.response);
    return true; 
  } catch (error) {
    console.log(error);
    return false; 
  }
};

//to verify OTP
const verifyOTP = (otpInput, generateOTP) => {
  return otpInput === generateOTP;
  
};

//to send OTP
module.exports.getSendOtp = async (req, res) => {
  try {
        clearTimeout(otpTimer);
         otpTimer = setTimeout(() => {
           generatedOTP = null; 
         }, 30000);
        const email1 = req.query.email;
        const email= await userCollection.findOne({ email: req.query.email });
        const phoneNumber= await userCollection.findOne({
          phoneNumber: req.query.phoneNumber,
        });
        if(email){
          res.status(200).json({ error: "Email already Exist" });
        }else if(phoneNumber){
          res.status(200).json({ error: "Number already Exist" });
        }else{

          generatedOTP = generateOTP();
          console.log(`the otp is ${generatedOTP}`);
          const success = await sendOTP(email1, generatedOTP);
          if (success) {
            res.status(200).json({ message: "OTP sent to email successfully" });
          } else {
            res.status(500).json({ error: "Failed to send OTP email" });
          }
        }

  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.postVerifyOtp = (req, res) => {
  try {

    const otpInput = req.body.otpInput;
    console.log(`generated otp : ${generatedOTP} and otp is : ${otpInput}`);
    const isVerified = verifyOTP(otpInput, generatedOTP);
    if (generatedOTP == null) {
      res.status(200).json({ error: "Otp Expired" });
    } else if (isVerified) {
      res.status(200).json({ message: "OTP verified successfully" });
    } else {
      res.status(200).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.getUserSignup = (req, res) => {
  res.render("user-signup");
};
