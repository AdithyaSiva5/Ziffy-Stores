const categoryCollection = require("../../models/category");
const productCollection = require("../../models/product");
const offerCollection = require("../../models/offer_schema")

module.exports.getOfferlist = async(req,res)=>{
    try {
    const offerData = await offerCollection.find();
    res.render("admin-offerlist", { offerData });
    } catch (error) {
    console.error("Error: ", error);
    }

}

module.exports.addOffer = async(req,res) =>{
    try {
        let categoryData = await categoryCollection.find();
        categoryData = categoryData.filter(
          (category) => category.categoryStatus !== "Block"
        );
        let productData = await productCollection.find();
        productData = productData.filter(
          (product) => product.productStatus !== "Block"
        );
        res.render("admin-addoffer", { categoryData, productData });        
    } catch (error) {
        console.log(error);
    }
}

module.exports.postOffer = async (req, res) => {
  try {
    const {offerType,offerName,discountPercentage,status,startDate,endDate,} = req.body;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let expired;
    if (startDate >= endDate) {
      expired = true;
    }
    let startDateObj = new Date(startDate);
    const existingOffer = await offerCollection.findOne({ offerName });
    if (existingOffer) {
      return res.status(400).json({ error: "An offer with the same name already exists" });
    } else if (expired) {
      return res.status(400).json({ error: "Expiry date should be less than starting Date" });
    } else if (startDateObj < currentDate) {
      return res.status(400).json({ error: "Start date must be in the future" });
    } else if (endDate < currentDate) {
      return res.status(400).json({ error: "End date must be in the future" });
    } else {
      const discountStatus = status === "Unblock" ? "Active" : "Inactive";

      const newOffer = new offerCollection({offerType,offerName,discountPercentage,status,startDate,endDate,});
      await newOffer.save();
      if (offerType === "category") {
        const category = await categoryCollection.findOne({catgName: offerName});
        await categoryCollection.updateOne({ catgName: offerName },{$set: {offerStart: startDateObj,offerEnd: new Date(endDate),discountPercent: discountPercentage, discountStatus}}
        );
      } else if (offerType === "product") {
        const product = await productCollection.findOne({productName: offerName,});

        await productCollection.updateOne({ productName: offerName },{$set: {offerStart: startDateObj,offerEnd: new Date(endDate),discountPercent: discountPercentage,discountStatus}});
      }

      res.status(200).json({ message: "Offer data received successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports.editOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const offerData = await offerCollection.findById(offerId);
    let categoryData = await categoryCollection.find();
    categoryData = categoryData.filter((category) => category.categoryStatus !== "Block");
    let productData = await productCollection.find();
    productData = productData.filter((product) => product.productStatus !== "Block");
    res.render("admin-editoffer", { offerData });
  } catch (error) {
    console.error("Error deactivating expired offers:", error);
  }
};


module.exports.postEditOffer = async (req, res) => {
  try {
    const {offerId,offerType,offerName,discountPercentage,status, startDate,endDate,} = req.body;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let startDateObj = new Date(startDate);
    let expired;

    if (startDate >= endDate) {
      expired = true;
    }

    if (expired) {return res.status(400).json({ error: "Expiry date should be less than starting Date" });
    } else if (startDateObj < currentDate) {
        return res.status(400).json({ error: "Start date must be in the future" });
    } else if (endDate < currentDate) {      
        return res.status(400).json({ error: "End date must be in the future" });
    } else {
      const result = await offerCollection.updateOne({ _id: offerId },{$set: {offerType,offerName,discountPercentage,status,startDate,endDate}});

      if (result.modifiedCount > 0) {
        const discountStatus = status === "Unblock" ? "Active" : "Inactive";

        if (offerType === "category") {
          const category = await categoryCollection.findOne({ catgName: offerName});

          await categoryCollection.updateOne({ catgName: offerName },{$set: {offerStart: startDateObj, offerEnd: new Date(endDate), discountPercent: discountPercentage, discountStatus,}});
        } else if (offerType === "product") {
          const product = await productCollection.findOne({
            productName: offerName,
          });

          await productCollection.updateOne({ productName: offerName }, {$set: {offerStart: startDateObj,offerEnd: new Date(endDate), discountPercent: discountPercentage,discountStatus}});
        }
        res.status(200).json({ message: "Offer updated successfully" });
      } else {
        res.status(404).json({ error: "Offer not found" });
      }
    }
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports.deactivateExpiredOffers = async () => {
  try {
    const currentDate = new Date();
    const expiredOffers = await offerCollection.find( { endDate: { $lt: currentDate }, isActive: true },{ offerName: 1 } );
    await offerCollection.updateMany({ endDate: { $lt: currentDate }, isActive: true }, { $set: { isActive: false } });

    for(const offer of expiredOffers) {
        await productCollection.updateMany( { productName: offer.offerName, discountStatus: "Active" },{ $set: { discountStatus: "Inactive" } })
    }
    await categoryCollection.updateMany( { offerEnd: { $lt: currentDate }, discountStatus: "Active" },{ $set: { discountStatus: "Inactive" } });
  } catch (error) {
    console.error("Error deactivating expired offers:", error);
  }
};

module.exports.blockOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const offerData = await offerCollection.findById(offerId);
    const offerName = offerData.offerName;

    await offerCollection.updateOne({ _id: offerId },{ $set: { status: "Block" } });

    await productCollection.updateMany({ productName: offerName }, { $set: { discountStatus: "Inactive" } } );

    res.redirect("/admin/offer-list");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// unblock offer
module.exports.unblockOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;

    const updatedStatus = await offerCollection.updateOne({ _id: offerId },{ $set: { status: "Unblock" } });

    const offerData = await offerCollection.findById(offerId);
    const offerName = offerData.offerName;

    await productCollection.updateMany({ productName: offerName },{ $set: { discountStatus: "Active" } });

    res.redirect("/admin/offer-list");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
