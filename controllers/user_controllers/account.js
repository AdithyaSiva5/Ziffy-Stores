const addressCollection = require("../../models/address_schema");
const orderCollection = require("../../models/order_schema");
const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart_schema");
const walletCollection  = require("../../models/wallet_schema")
const walletHistoryCollection = require("../../models/wallethistory_schema");



module.exports.getUserAccount = async(req,res)=>{
    try {
        const loggedIn = req.cookies.loggedIn;
        const user = await userCollection.findOne({email : req.user})
        const userData = await userCollection.findOne({ email: req.user });
        const userCart = await cartCollection.findOne({ userId : user._id})
        const referels = await userCollection.find({_id: { $ne: user._id }},{_id : 0,referelId : 1});
        let cartLength;
        if(userCart && userCart.products){
            cartLength = userCart.products.length;
        }else{
            cartLength = 0;
        }
        const userAddress = await addressCollection.findOne({userId : user._id})
        const userOrders = await orderCollection.find({ userId: user._id }).populate('products.productId');
        const wallet = await walletCollection.findOne({ userId: user._id });

        const walletHistory = await walletHistoryCollection.find({ userId: user._id }).sort({ transactionDate: -1 });
        
        res.render("user-account", { loggedIn, userData ,userCart ,userAddress, userOrders ,cartLength , wallet , referels ,walletHistory});
        
        
    } catch (error) {
        console.log(error);
        next(error);
        
    }
    
}
 

module.exports.applyReferelOffers = async (req, res) => {
  try {
    const referelcode = req.query.referel;
    const userData = await userCollection.findOne({ email: req.user });
    const usedReferel = await userCollection.findOne({
      referelId: referelcode,
    });
    const myReferelCode = userData.referelId;

    if (usedReferel) {
      if (usedReferel.redmmedreferels.includes(userData._id)) {
        res.status(200).send({ error: "Offer already redeemed by the user" });
      } else if (referelcode === myReferelCode) {
        res.status(200).send({ error: "Unable to apply yourself" });
      } else {
        usedReferel.redmmedreferels.push(userData._id);
        await usedReferel.save();
        await userCollection.updateOne(
          { _id: userData._id },
          { $set: { appliedReferel: true } }
        );

        const userWallet = await walletCollection.findOne({
          userId: userData._id,
        });
        userWallet.amount += 100;
        await userWallet.save();

        const referedUserWallet = await walletCollection.findOne({
          userId: usedReferel._id,
        });
        referedUserWallet.amount += 200;
        await referedUserWallet.save();

        //wallet history creation
        const referringUserHistoryEntry = new walletHistoryCollection({
          userId: userData._id,
          walletId: userWallet._id,
          type: "Referral Bonus",
          amount: 100,
          description: "Referral bonus for inviting a friend",
        });
        await referringUserHistoryEntry.save();

        // Add wallet history entry for referred user
        const referredUserHistoryEntry = new walletHistoryCollection({
          userId: usedReferel._id,
          walletId: referedUserWallet._id,
          type: "Referral Bonus",
          amount: 200,
          description: "Referral bonus for being referred by a friend",
        });
        await referredUserHistoryEntry.save();


        res.status(200).send({ success: "Offer redeemed successfully" });
      }
    } else {
      res.status(200).send({ error: "Invalid referral code" });
    }
  } catch (error) {
    console.error(error);
    res.status(200).send({ error: "Internal Server Error" });
  }
};