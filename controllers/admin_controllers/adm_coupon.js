const couponCollection = require("../../models/coupon_schema")

module.exports.getCoupons = async(req,res)=>{
    try {
        const coupons = await couponCollection.find()
        res.render("admin-coupon", { coupons });
    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports.getAddCoupon = async (req,res) =>{
    try {
        res.render("admin-addcoupon");
    } catch (error) {
        console.log(error);
        next(error)
    }
}
module.exports.postAddCoupon = async(req,res)=>{    
    try{
        const { couponCode, description, discountAmount, minimumPurchase, status, expiryDate} = req.body;
        const ifExist = await couponCollection.findOne({ couponCode });
        if (ifExist) {
          return res.status(500).json({ error: "This Coupon already exists" });
        }
        await couponCollection.create({
          couponCode, description, discountAmount, minimumPurchase, status, expiryDate
        });
        return res.status(200).json({success : true});

    }catch(error){
          console.log(error);
          next(error);

    }
}


module.exports.getEditCoupon = async(req,res)=>{
    try {
        const coupon_id = req.params.coupon_id;
        const coupon_edit = await couponCollection.findOne({ _id: coupon_id });
        res.render("admin-couponedit", { coupon_edit });
    } catch (error) {
        console.log(error);
        next(error)
    }
}
module.exports.postEditCoupon = async(req,res)=>{
    try {
    const coupon_id = req.params.coupon_id;
    const { couponCode, description, discountAmount, minimumPurchase, status, expiryDate} = req.body;
    const ifExist = await couponCollection.findOne({ couponCode, _id: { $ne: coupon_id } });
    if (ifExist) {
      return res.status(200).json({error: "This Coupon already exists"});
    }
    await couponCollection.findByIdAndUpdate(coupon_id, {couponCode, description, discountAmount, minimumPurchase, status, expiryDate})
    return res.status(200).json({success : true});        
    } catch (error) {
        console.log(error);
        next(error);
    }
}
module.exports.blockCoupon = async (req, res) => {
  try {
    const coupon_id = req.params.coupon_id;
    await couponCollection.findByIdAndUpdate(coupon_id, { status: "Inactive" });
    res.redirect("/admin/coupons");
  } catch (error) {
    console.error(error);
  }
};

module.exports.unblockCoupon = async (req, res) => {
  try {
    const coupon_id = req.params.coupon_id;
    await couponCollection.findByIdAndUpdate(coupon_id, { status: "Active" });
    res.redirect("/admin/coupons");
  } catch (error) {
    console.error(error);
  }
};