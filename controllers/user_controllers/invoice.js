const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const orderCollection = require("../../models/order_schema");


module.exports.invoice = async (req, res) => {
try {
    const userData = await userCollection.findOne({ email: req.user });
    const orderId = req.query.orderId;
    const orderData = await orderCollection.findOne({ _id: orderId }).populate({path : "products.productId",model : productCollection});
    const addressId = orderData.address;
    const addressData = addressId.address;
    const productIds = orderData.products;
    const productsData = await productCollection.find({_id: { $in: productIds }});
    res.render("user-invoice", { orderData, addressData, productsData });

} catch (error) {
    console.error("Error:", error);
    next(error)
}
};
