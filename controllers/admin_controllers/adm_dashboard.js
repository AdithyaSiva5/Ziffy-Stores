const productCollection = require("../../models/product");
const orderCollection = require("../../models/order_schema");
const userCollection = require("../../models/user_schema");
const categoryCollection = require("../../models/category");

module.exports.gettoDashboard = async (req, res) => {
try {
    if (req.cookies.admintoken) {
    const orderDetails = await orderCollection.find().populate({ path : "userId" , model : userCollection})
    const totalSales = await orderCollection.aggregate([{ $match : {paymentStatus : "Success"}},{$group : {_id : null ,totalAmount : {$sum : "$totalAmount"}}}]) 
    const totalOrders = await orderCollection.find()
    const totalProducts = await productCollection.find();
    const totalCategories = await categoryCollection.find();
    const users = await userCollection.find();
    const statistics = {
      totalSales,
      totalOrders: totalOrders.length,
      totalProducts: totalProducts.length,
      totalCategories: totalCategories.length,
      totalUsers: users.length,
    };
    const cancelData = await orderCollection.aggregate([{$match : {orderStatus : "Cancelled"}},{$group:{_id:{ $month : '$orderDate'}, count : {$sum : 1}}},{$project:{_id : 1,count:{$ifNull:['$count',0]}}}])
    const returnData = await orderCollection.aggregate([{$match : {orderStatus : "Returned"}},{$group:{_id:{ $month : '$orderDate'}, count : {$sum : 1}}},{$project:{_id : 1,count:{$ifNull:['$count',0]}}}])
    const orderData = await orderCollection.aggregate([{$group:{_id:{ $month : '$orderDate'}, count : {$sum : 1}}},{$project:{_id : 1,count:{$ifNull:['$count',0]}}}])
    
    const filledOrderData = fillDataWithZeroes(orderData);
    const filledCancelData = fillDataWithZeroes(cancelData);
    const filledReturnData = fillDataWithZeroes(returnData);
    
    function fillDataWithZeroes(data) {
        const labels = Array.from({ length: 12 }, (_, index) => index + 1);
        return labels.map((month) => {
        const existingMonth = data.find((item) => item._id === month);
        return {
            _id: month,
            count: existingMonth ? existingMonth.count : 0,
        };
        }); 
    }
    const startingMonth = 11;
    const labels = Array.from({ length: 12 }, (_, index) => (index + startingMonth) % 12 + 1);
    const chartFeeder = {
    orderData: filledOrderData,
    cancelData: filledCancelData,
    returnData: filledReturnData,

    };

     res.render("admin-dashboard", { orderDetails, statistics, chartFeeder: JSON.stringify(chartFeeder) });
     }else {
       res.render("admin-login");
     }
        
} catch (error) {
 console.log(error)  
 next(error);
}    
};
