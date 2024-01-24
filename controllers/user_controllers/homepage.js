const productCollection = require("../../models/product")
const offerController = require("../../controllers/admin_controllers/adm_offers")
const bannerCollection = require("../../models/banner_schema")

//homepage
module.exports.getUserRoute = async (req,res) => {
    try{
        const banners = await bannerCollection.find();
        const loggedIn = req.cookies.loggedIn;
        await offerController.deactivateExpiredOffers();
        const productdata = await productCollection.find().limit(6)
        const unblockedProducts = productdata.filter(product => product.productStatus !== 'Block');
        const productOffers = await productCollection.find({discountStatus: "Active"});

        res.render("userIndex",{loggedIn,productdata : unblockedProducts , banners});
    }catch(error){
        console.error(error);
        next(error);
    }
}


//logout
module.exports.getLogout = (req,res) =>{
res.clearCookie("token")
res.clearCookie("loggedIn")
res.redirect("/login")
}

