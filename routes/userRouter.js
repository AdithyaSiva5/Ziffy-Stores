const express = require("express");
const userRouter = express.Router();
const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const userMiddleware = require("../user-midddleware/user_authentication");
const loginControll = require("../controllers/user_controllers/login");
const signupControll = require("../controllers/user_controllers/signup");
const homepageControll = require("../controllers/user_controllers/homepage");
const productControll = require("../controllers/user_controllers/productdetails");
const forgetpassword = require("../controllers/user_controllers/forgetpassword");
const cart = require("../controllers/user_controllers/cart")
const account = require("../controllers/user_controllers/account")
const checkoutpage = require("../controllers/user_controllers/checkout")
const address = require("../controllers/user_controllers/address")
const orders = require("../controllers/user_controllers/order")
const userError = require("../user-midddleware/error_handling")
const invoice = require("../controllers/user_controllers/invoice")

userRouter.use(cookieparser());

//homepage
userRouter.get("/", homepageControll.getUserRoute,userMiddleware.verifyUser,userMiddleware.checkBlockedStatus);
userRouter.get("/logout", homepageControll.getLogout);

//login
userRouter.get("/login", loginControll.getLogin);
userRouter.post("/post-login", loginControll.postLogin);

//signup
userRouter.get("/signup", signupControll.getUserSignup);
userRouter.post("/post-signup", signupControll.postUserSignup); 
userRouter.get("/send-otp", signupControll.getSendOtp);
userRouter.post("/verify-otp", signupControll.postVerifyOtp);

//products
userRouter.get("/product-details/:productId",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus,productControll.productDetails);
userRouter.get("/products",productControll.productFulldetails)
userRouter.get("/search-and-filter", productControll.searchandfilter);

//forgetpassword
userRouter.get("/forgetpassword", forgetpassword.forgetpass);
userRouter.post("/post-sentotp", forgetpassword.postforget);
userRouter.post("/post-forgetpassword", forgetpassword.postreset);


//cart
userRouter.get("/cart",userMiddleware.verifyUser,cart.getcart);
userRouter.post("/addToCart", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus, cart.gettocart);
userRouter.post("/update-quantity",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus,cart.updateQuantity);
userRouter.post("/remove-from-cart/:productId",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus,cart.removeFromCart);

//checkout
userRouter.get("/checkout", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,checkoutpage.getcheckout);
userRouter.get("/stockchecking", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,checkoutpage.stockchecking);
userRouter.get("/apply-coupon", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus , checkoutpage.applyCoupon);


//orders
userRouter.get("/place-order-cod/:addressId", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus , orders.orderViaCod);
userRouter.get("/place-order-razerpay/:addressId", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus , orders.orderViaOnline);
userRouter.get("/place-order-walletpay/:addressId", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus , orders.wallet);
userRouter.post("/update-payment-status",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus , orders.updatePaymentStatus);
userRouter.get("/order-placed/:orderId", userMiddleware.verifyUser,userMiddleware.checkBlockedStatus, orders.getOrderPlaced);
userRouter.get("/cancel-order/:orderId",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,orders.cancelOrder)
userRouter.get("/return-order/:orderId",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,orders.returnOrder)
userRouter.post("/cancelSingle-order", userMiddleware.verifyUser, userMiddleware.checkBlockedStatus , orders.cancelSingleOrder)
userRouter.get("/view-order",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus, orders.viewOrders);





//User account
userRouter.get("/user-account",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,account.getUserAccount);
userRouter.post("/applyreferel" ,userMiddleware.verifyUser,userMiddleware.checkBlockedStatus, account.applyReferelOffers);


//address 
userRouter.post("/post-add-address",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,address.postAddAddress);
userRouter.post("/post-edit-address",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,address.postEditAddress);
userRouter.get('/delete-address',userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,address.deleteAddress);


//download Invoice
userRouter.get("/get-Invoice",userMiddleware.verifyUser,userMiddleware.checkBlockedStatus ,invoice.invoice)




//error handling
userRouter.use(userError.errorHandler);
userRouter.get('/*',userError.errorHandler2)





module.exports = userRouter; 