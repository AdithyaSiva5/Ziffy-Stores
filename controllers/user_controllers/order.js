const userCollection = require("../../models/user_schema");
const cartCollection = require("../../models/cart_schema");
const addressCollection = require("../../models/address_schema");
const productCollection = require("../../models/product");
const orderCollection = require("../../models/order_schema")
const razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const couponCollection = require("../../models/coupon_schema");
const walletCollection = require("../../models/wallet_schema");
const walletHistoryCollection = require("../../models/wallethistory_schema")

const { RAZOR_PAY_key_id, RAZOR_PAY_key_secret } = process.env;

//razorpay instance
var instance = new razorpay({
  key_id: RAZOR_PAY_key_id,
  key_secret: RAZOR_PAY_key_secret,
});

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

module.exports.orderViaCod = async (req,res)=>{
    try {
        const couponCode = req.query.coupon;
        user = await userCollection.findOne({email : req.user})
        const userCart = await cartCollection.findOne({ userId : user._id }).populate({path : "products.productId" , model : productCollection});
        const useraddress = await addressCollection.findOne({"address._id": req.params.addressId}, { "address.$": 1 });
         for (const product of userCart.products) {
            if (product.quantity > product.productId.productStock || product.productId.productStock == 0) {
                return res.status(200).json({ backToCart: true });
            }
        };
        // const productArray = userCart.products.map((product) => ({
        //       productId: product.productId._id,
        //       price: product.productId.sellingPrice,
        //       quantity: product.quantity, 
        //     })); 

            const productArray = userCart.products.map((product) => {
              let price;
              if (product.productId.discountStatus === "Active" && typeof product.productId.discountPercent === "number") {
                price =product.productId.sellingPrice -(product.productId.sellingPrice *product.productId.discountPercent) /100;
              } else {
                price = product.productId.sellingPrice;
              }

              return {
                productId: product.productId._id,
                price: price,
                quantity: product.quantity,
              };
            });




            
        let totalAmount = calculateTotalPrice(userCart);
        
        if(couponCode){
          const reduced = await couponCollection.findOne({ couponCode : couponCode });
          if (reduced) {
            totalAmount = totalAmount - reduced.discountAmount;
          }
        }
         const paymentMethod = "Cash on Delivery";
         const createdOrder = await orderCollection.create({
           userId: user._id,
           products: productArray,
           totalAmount,
           paymentMethod,
           address: useraddress,
         });
         if (couponCode) {
          const reduced = await couponCollection.findOne({ couponCode: couponCode });
          createdOrder.couponDiscount = reduced.discountAmount;
          await createdOrder.save();
         }

         for (const product of userCart.products){
            await productCollection.updateOne({_id : product.productId._id},{$inc : { productStock : -product.quantity}});
         }
         await cartCollection.deleteOne({ userId: user._id });
        const orderId = createdOrder._id;
        return res.status(200).json({ orderId });   

    } catch (error) {
        console.log(error);
        next(error);
    }
    
}

module.exports.getOrderPlaced = async(req,res)=>{
    try{

    const ifOrderExist = await orderCollection.findById(req.params.orderId);
    if(ifOrderExist){
      res.render('user-order-placed');
    }
  }catch(error){
    next(error);
  }
}
module.exports.viewOrders = async(req,res)=>{
  const loggedIn = req.cookies.loggedIn;
  orderId = req.query.orderId;
  let cartLength, user;
  user = await userCollection.findOne({ email: req.user });
  if(loggedIn){
    const userCart = await cartCollection.findOne({ userId : user._id })
    if(userCart &&  userCart.products){
      cartLength = userCart.products.length;
    }
  }
    const orderDetails = await orderCollection.findOne({_id : orderId}).populate({path : "products.productId" , model : productCollection});
    res.render("view-orders", {cartLength, loggedIn, orderDetails, user }); 
}

module.exports.cancelOrder = async(req,res)=>{
  try{
    const orderId = req.params.orderId;
    const order = await orderCollection.findById(orderId).populate({path: 'products.productId' , model : productCollection});
    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ error: "The order is already cancelled" });
    }
    
    for (const orderProduct of order.products) {
      const product = orderProduct.productId;

      if (orderProduct.status !== "Cancelled") {
        orderProduct.status = "Cancelled";
        product.productStock += orderProduct.quantity;
        await product.save();
      }
    }
        order.orderStatus = "Cancelled";
        order.paymentStatus = "Failed";
        await order.save();

    // await orderCollection.findByIdAndUpdate(orderId, {orderStatus: 'Cancelled', paymentStatus: 'Failed'});
    res.redirect(`/view-order?orderId=${orderId}`);
  }catch (error) {
   console.log(error)
   next(error);
  }
}

module.exports.returnOrder = async (req, res, next) => {
    try {
      let walletAmount = 0;
      let refundAmount = 0;
      let num = 0;
      const orderId = req.params.orderId;
      await orderCollection.findByIdAndUpdate(orderId, {
        orderStatus: "Returned",
        paymentStatus: "Failed",
      });
      const order = await orderCollection.findById(orderId).populate({path: 'products.productId' , model : productCollection});
      for (const orderProduct of order.products) {
        const product = orderProduct.productId;

        if (orderProduct.status !== "Cancelled") {
          orderProduct.status = "Returned";
          product.productStock += orderProduct.quantity;
          refundAmount += orderProduct.quantity * orderProduct.price;
          num++;
          await product.save();
        }
      }
        order.totalAmount = 0;
        
          let couponreduce = 0;

          if (order.couponDiscount) {
            couponreduce = order.couponDiscount / num;
          }
          const user = await userCollection.findOne({ email: req.user });
          const walletData = await walletCollection.findOne({
            userId: user._id,
          });
            walletAmount = walletData.amount + refundAmount - couponreduce;
          await walletData.updateOne({ $set: { amount: walletAmount } });

          //wallethistory
              const walletHistoryEntry = new walletHistoryCollection({
                userId: user._id,
                walletId: walletData._id,
                type: "Return",
                amount: refundAmount - couponreduce,
                description: `Order #${orderId} returned`,
              });
              await walletHistoryEntry.save();

             
     
      await order.save();

      res.redirect(`/view-order?orderId=${orderId}`);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  module.exports.wallet = async (req, res) => {
      let walletAmount = 0;
      let totalAmount = 0;
      const couponCode = req.query.coupon;
      user = await userCollection.findOne({ email: req.user });
      const userCart = await cartCollection.findOne({ userId : user._id }).populate({path : "products.productId" , model : productCollection});
      const useraddress = await addressCollection.findOne({"address._id": req.params.addressId}, { "address.$": 1 });
         const walletData = await walletCollection.findOne({ userId: user._id });
         if(walletData){
            walletAmount = walletData.amount;
          }

      userCart.products.forEach(product=>{
      if(product.quantity > product.productId.productStock || product.productId.productStock == 0){
        return res.status(200).json({backToCart: true})
      }
    });
    const productArray = userCart.products.map((product) => {
      let price;
      if (product.productId.discountStatus === "Active" && typeof product.productId.discountPercent === "number") {
        price =product.productId.sellingPrice -(product.productId.sellingPrice *product.productId.discountPercent) /100;
      } else {
        price = product.productId.sellingPrice;
      }
        return {
        productId: product.productId._id,
        price: price,
        quantity: product.quantity,
      };
    });
     
    totalAmount = calculateTotalPrice(userCart);
      if (couponCode) {
        const reduced = await couponCollection.findOne({couponCode: couponCode});
        if(reduced){
          totalAmount = totalAmount - reduced.discountAmount;
        }
      }
      if(walletAmount < totalAmount){
         return res.status(200).json({ error: "No Amount in Wallet" });
      }
      walletAmount -= totalAmount;
      await walletData.updateOne({ $set: { amount: walletAmount } });

      //wallet history
      const walletHistoryEntry = new walletHistoryCollection({
        userId: user._id,
        walletId: walletData._id,
        type: "Purchase",
        amount: -totalAmount,
        description: "Amount deducted for a purchase",
      });
      await walletHistoryEntry.save();



      //wallet creation
           
    const paymentMethod = "Wallet";
    const createdOrder = await orderCollection.create({
      userId: user._id,
      products: productArray,
      totalAmount,
      paymentMethod,
      address: useraddress,
    });

    if (couponCode) {
      const reduced = await couponCollection.findOne({
        couponCode: couponCode,
      });
      createdOrder.couponDiscount = reduced.discountAmount;
      await createdOrder.save();
    }

    const orderId = createdOrder._id;
    return res.status(200).json({ orderId });
  };

module.exports.orderViaOnline = async(req,res,next)=>{
      let totalAmount = 0;
        const couponCode = req.query.coupon;
      user = await userCollection.findOne({ email: req.user });
      const userCart = await cartCollection.findOne({ userId : user._id }).populate({path : "products.productId" , model : productCollection});
      const useraddress = await addressCollection.findOne({"address._id": req.params.addressId}, { "address.$": 1 });
      userCart.products.forEach(product=>{
      if(product.quantity > product.productId.productStock || product.productId.productStock == 0){
        return res.status(200).json({backToCart: true})
      }
    });
    const productArray = userCart.products.map((product) => {
      let price;
      if (product.productId.discountStatus === "Active" && typeof product.productId.discountPercent === "number") {
        price =product.productId.sellingPrice -(product.productId.sellingPrice *product.productId.discountPercent) /100;
      } else {
        price = product.productId.sellingPrice;
      }
            return {
        productId: product.productId._id,
        price: price,
        quantity: product.quantity,
      };
    });
     
     totalAmount = calculateTotalPrice(userCart);
        if (couponCode) {
          const reduced = await couponCollection.findOne({
            couponCode: couponCode,
          });
          if (reduced) {
            totalAmount = totalAmount - reduced.discountAmount;
          }
        }
     const paymentMethod = "Online Payment";

     var options = {
       amount: totalAmount*100,
       currency: "INR",
       receipt: uuidv4(),
     };
     const razorOrder = await instance.orders.create(options);

    //order creation
    const createdOrder = await orderCollection.create({
      userId: user._id,
      products: productArray,
      orderStatus: "Order Failed",
      paymentStatus: "Failed",
      totalAmount,
      paymentMethod,
      address: useraddress,
    });

    if (couponCode) {
      const reduced = await couponCollection.findOne({
        couponCode: couponCode,
      });
      if (reduced){
        createdOrder.couponDiscount = reduced.discountAmount;
      }  

      await createdOrder.save();
    }



    const orderId = createdOrder._id;
    return res.status(200).json({ razorOrderId: razorOrder.id, orderId });
}

module.exports.updatePaymentStatus = async (req, res, next) => {
  try {
    user = await userCollection.findOne({ email: req.user });
    const userCart = await cartCollection.findOne({ userId : user._id }).populate({path : "products.productId" , model : productCollection});
    const paymentStatus = req.query.paymentStatus;
    const orderId = req.query.orderId;
    await orderCollection.findByIdAndUpdate(orderId, {
      paymentStatus,
    });
    if (paymentStatus == "Success") {
       await orderCollection.findByIdAndUpdate(orderId, {
         orderStatus: "Order Placed",
         paymentStatus: "Success",
       });
          for (const product of userCart.products) {
            await productCollection.updateOne(
              { _id: product.productId._id },
              { $inc: { productStock: -product.quantity } }
            );
          }
          await cartCollection.deleteOne({ userId: user._id });

      return res.status(200).json({ paymentStatus: "Success" });
    } else {
      const order = await orderCollection.findById(orderId);
      if (order) {
        await orderCollection.findByIdAndUpdate(orderId, {
          orderStatus: "Order Failed",
        });
        for (const product of order.products) {
          await productCollection.updateOne(
            { _id: product.productId },
            { $inc: { productStock: product.quantity } }
          );
        }
      }
      return res.status(200).json({ paymentStatus: "Failed" });
    }
  } catch (error) {
    console.log(error)
    next(error);
  }
};

  module.exports.cancelSingleOrder = async(req,res) =>{
    try {    
      const orderId = req.query.orderId;
      const productId = req.query.productId;
      const orderData = await orderCollection.findById(orderId);
      const product = orderData.products.find((item) => item.productId.equals(productId));

      if (product.status === "Cancelled") { 
          return res.status(200).json({ error: "The product is already cancelled" });
      }else if (product.status === "Delivered") {
          return res.status(200).json({ error: "Single Order Returning Currently Not Available" });
      }else if(product.status === "Returned"){
          return res.status(200).json({ error: "Item Already Returned" });

      }
      const productAmount = product.price;
      const updateStatus = { $set: { "products.$.status": "Cancelled" } };
      const updatedOrder = await orderCollection.findOneAndUpdate({ _id: orderId, "products.productId": productId},updateStatus,{ new: true });

      orderData.totalAmount -= productAmount;
      await orderData.save();

      for (const orderProduct of orderData.products) {
        const product = await productCollection.findById(orderProduct.productId);
        product.productStock += orderProduct.quantity;
        await product.save();
      }
      const refreshedOrder = await orderCollection.findById(orderId);
      const allProductsCancelled = refreshedOrder.products.every(product => product.status === "Cancelled");
      
      if(allProductsCancelled){
        await orderCollection.updateOne({ _id: orderId }, { $set: { orderStatus: "Cancelled" } });
      }

      res.status(200).json({ message: "The order is cancelled" });
    } catch (error) {
      
    }
  }

