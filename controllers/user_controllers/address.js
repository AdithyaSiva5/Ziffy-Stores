const userCollection = require("../../models/user_schema");
const addressCollection = require("../../models/address_schema");

module.exports.postAddAddress = async (req, res) => {
    try {
        
        const {name, addressType, city, landMark, state, pincode, phone, altPhone} = req.body;
        const user = await userCollection.findOne({ email: req.user });
        const useraddress = await addressCollection.findOne({ userId : user._id})
        if(useraddress){ 
            useraddress.address.push({addressType,name, city, landMark, state, pincode, phone, altPhone});
            await useraddress.save();
        }
        else{
            await addressCollection.create({ userId : user._id , address : [{name,addressType, city, landMark, state, pincode, phone, altPhone}]});
    
        }
         const isFromAccount = req.query.source === "account";
         if (isFromAccount) {
          res.redirect("user-account" );
         } else {
          res.redirect("checkout")
         }
    } catch (error) {
        console.log(error);
        next(error);
    }

};



module.exports.postEditAddress = async(req,res)=>{
    try {
    const { data, addressId } = req.body;
    const user = await userCollection.findOne({email: req.user});
    const userAddress = await addressCollection.findOneAndUpdate(
      { "address._id": addressId },
      {
        $set: {
          "address.$.addressType": data.addressType,
          "address.$.name": data.name,
          "address.$.city": data.city,
          "address.$.landMark": data.landmark,
          "address.$.state": data.state,
          "address.$.pincode": data.postcode,
          "address.$.phone": data.phoneNumber,
          "address.$.altPhone": data.altPhone,
        },
      }
    );
    res.json({ success: true, message: "Address Updated" });

    } catch (error) {
      console.log(error);
      next(error);
        
    }
}

module.exports.deleteAddress = async(req,res)=>{
    try {
      const addressId = req.query.addressId;
      const user = await userCollection.findOne({ email: req.user });
      const userAddress = await addressCollection.updateOne(
        { userId: user._id },
        {
          $pull: {
            address: {
              _id: addressId,
            },
          },
        }
      );
      res.redirect("/user-account");
    } catch (error) {
      
      console.log(error);
      next(error);
    }
}