const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart_schema");
const mongoose = require("mongoose");
const addressCollection = require("../../models/address_schema");
const couponCollection = require("../../models/coupon_schema")
 
const calculateTotalPrice = (cart) => {
  let total = 0,
    newprice,
    subtotal;
  for (const items of cart.products) {
    if (
      items.productId.discountStatus === "Active" &&
      typeof items.productId.discountPercent === "number"
    ) {
      newprice =
        items.productId.sellingPrice -
        (items.productId.sellingPrice * items.productId.discountPercent) / 100;
      subtotal = items.quantity * newprice;
      total += subtotal;
    } else {
      subtotal = items.quantity * items.productId.sellingPrice;
      total += subtotal;
    }
  }

  return total;
};

module.exports.getcheckout = async (req, res) => {
  try {
    let grandTotal = 0;
    let couponDiscount = 0;
    const loggedIn = req.cookies.loggedIn;
    const userData = await userCollection.findOne({ email: req.user });
    const userCart = await cartCollection.findOne({ userId: userData._id }).populate({ path: "products.productId", model: productCollection });
    const userAddress = await addressCollection.findOne({ userId : userData._id});
    if (!userCart || !userCart.products || userCart.products.length === 0) {
      return res.redirect("/cart")
    }
     grandTotal = calculateTotalPrice(userCart);
     const coupons = await couponCollection.find({status: { $ne: "Inactive" }, expiryDate: { $gte: new Date() },
     });
    res.render("user-checkout", { loggedIn, userCart, grandTotal ,userAddress , coupons , couponDiscount});    
  } catch (error) { 
    console.log(error)
    next(error);
  }
};
 
module.exports.stockchecking = async(req,res) =>{
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userCart = await cartCollection.findOne({ userId: userData.id }).populate({path: "products.productId",model: productCollection,});
     if (userCart && userCart.products.length > 0) {
       const hasZeroStock = userCart.products.some(
         (product) => product.productId.productStock === 0
       );

       if (hasZeroStock) {
          res.status(400).json({ message: "Some products in your cart are out of stock." });
       } else {
         res.redirect("/checkout");
       }
     } else {
       res.status(400).send("Your cart is empty.");
     }
  } catch (error) {
    console.log(error);
    next(error);
  }
}

module.exports.applyCoupon = async(req,res)=>{
  try {
    user = await userCollection.findOne({ email: req.user });
    const userCart = await cartCollection.findOne({ userId : user._id }).populate({path : "products.productId" , model : productCollection});
    let grandTotal = calculateTotalPrice(userCart);
    let couponDiscount = 0;
    const couponCode = req.query.couponCode;
    const coupon = await couponCollection.findOne({couponCode});
    if(!coupon){
      return res.status(200).json({error: "Invalid Coupon"});
    }
    if(coupon.status != 'Active'){
      return res.status(200).json({error: "Coupon is blocked"});
    }
    if(coupon.expiryDate < new Date()){
      return res.status(200).json({error: "Coupon is expired"});
    }
    if(coupon.minimumPurchase > grandTotal){
      return res.status(200).json({error: `Minimum Purchase Amount is ₹${coupon.minimumPurchase}`});
    }
    if (coupon.redeemedUsers.includes(user._id)) {
      return res.status(200).json({ error: "Coupon has already been redeemed" });
    }
    
    let updatedTotal = grandTotal - coupon.discountAmount;
    couponDiscount = coupon.discountAmount;
    return res.status(200).json({message: "Coupon has been applied", updatedTotal, couponCode, grandTotal, couponDiscount});
    
  } catch (error) {
    console.log(error)
  }

}