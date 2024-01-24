const userCollection = require("../../models/user_schema");
const adminCollection = require("../../models/admin_schema");
const productCollection = require("../../models/product");
const offerCollection = require("../../models/offer_schema");
const categoryCollection = require("../../models/category")


const jwt = require("jsonwebtoken");
const secretkey = process.env.JWT_KEY;

module.exports.productDetails = async(req,res)=>{
    try{
        const loggedIn = req.cookies.loggedIn;
        const Idproduct = req.params.productId;
        const productdata = await productCollection.findById({_id:Idproduct})
        const category = productdata.productCategory;
        const relatedProducts = await productCollection.find({productCategory: category});
        const offerData = await offerCollection.find({isActive: true,status: "Unblock"});
        res.render("user-productdetails", { loggedIn, productdata, offerData ,relatedProducts});
        

    }catch(error){
        console.log(error);
        next(error);
    }
}
module.exports.productFulldetails = async(req,res)=>{
    try {


        const loggedIn = req.cookies.loggedIn;
        const productdata = await productCollection.find();
        const categories = await categoryCollection.find({ categoryStatus : "Unblock"});
        var unblockedProducts = productdata.filter(product => product.productStatus !== 'Block');
         if (req.query.searchInput) {
            const regexPattern = new RegExp(req.query.searchInput, "i");
                      unblockedProducts = await productCollection.find({
                        $and: [
                          { productName: { $regex: regexPattern } },
                          { productStatus: "Unblock" },
                        ],
                      });

                }
        res.render("products-page", { loggedIn, productdata: unblockedProducts ,categories });
        
    } catch (error) {
        
    }
}


module.exports.searchandfilter = async(req,res)=>{
  try {
    //getting the values
    let products = [];
    const categoryName = req.query.categoryName || "";
    const sort = req.query.sort || "";
    const searchInput = req.query.searchInput || "";

    const invalidChars = /[\\^$.*+?()[\]{}|]/g;

    //common
    const loggedIn = req.cookies.loggedIn;
    let regexPattern = new RegExp(".*", "i"); 

    if (!invalidChars.test(searchInput)) {
       regexPattern = new RegExp(searchInput, "i");
    } else {
      console.log("Invalid Text");
    }

    if (categoryName && sort) {
      products = await productCollection
        .find({
          $and: [
            { productName: { $regex: regexPattern } },
            { productStatus: "Unblock" },
            { productCategory: categoryName },
          ],
        })
        .sort({ sellingPrice: parseFloat(sort) });
    } else if (categoryName && !sort) {
      products = await productCollection.find({
        $and: [
          { productName: { $regex: regexPattern } },
          { productStatus: "Unblock" },
          { productCategory: categoryName },
        ],
      });
    } else if (!categoryName && sort) {
      products = await productCollection
        .find({
          $and: [
            { productName: { $regex: regexPattern } },
            { productStatus: "Unblock" },
          ],
        })
        .sort({ sellingPrice: parseFloat(sort) });
    } else if (searchInput && !categoryName && !sort) {
      products = await productCollection.find({
        $and: [
          { productName: { $regex: regexPattern } },
          { productStatus: "Unblock" },
        ],
      });
    } else {
      products = await productCollection.find({ productStatus: "Unblock" });
    }

    res.json({ productdata: products });
  } catch (error) {
    console.log(error);
    next(error);
  }
}