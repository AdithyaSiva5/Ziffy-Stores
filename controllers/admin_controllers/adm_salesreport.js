const mongoose = require("mongoose")
const orderCollection = require("../../models/order_schema")
const excelJS = require("exceljs");
const moment = require("moment");


module.exports.salesReport = async(req,res) =>{
    try {
        const orderData = await orderCollection.find({ orderStatus : "Delivered"})
        res.render("admin-salesReport",{orderData})
    } catch (error) {
        console.log(error)     
        next(error);   
    }
}
module.exports.filterSales = async (req, res, next) => {
  try {
    const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : null;



      //  console.log("startDate1:", startDate); // Log startDate1
      //  console.log("endDate1:", endDate;

       
    let orderData;

    if (!startDate && !endDate) {
      orderData = await orderCollection
        .find({
          orderStatus: "Delivered",
        })
        .sort({ createdAt: -1 })
        .exec();
    } else if (!endDate) {
      orderData = await orderCollection
        .find({
          orderStatus: "Delivered",
          updatedAt: { $gte: startDate },
        })
        .sort({ createdAt: -1 })
        .exec();
    } else if (startDate && endDate) {
      orderData = await orderCollection
        .find({
          orderStatus: "Delivered",
          updatedAt: { $gte: startDate, $lte: endDate },
        })
        .sort({ createdAt: -1 })
        .exec();
    }
    //print sales report
    if (req.body.generateExcel) {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");
      worksheet.columns = [
        { header: "Order Id", key: "_id", width: 10 },
        { header: "Ordered At", key: "orderDate", width: 10 },
        { header: "Payment Status", key: "paymentStatus", width: 10 },
        { header: "Order Status", key: "orderStatus", width: 10 },
        { header: "Total Amount", key: "totalAmount", width: 10 },
      ];

  orderData.forEach((order) => {
    const row = worksheet.addRow(order);

    const orderIdCell = row.getCell("_id");
    orderIdCell.value = `orderId_${order._id.toString().slice(0, 6)}`;

    const orderDateCell = row.getCell("orderDate");
    orderDateCell.value = moment(order.orderDate).format("MMM Do YY");

    
    const paymentStatusCell = row.getCell("paymentStatus");
    paymentStatusCell.value = `${order.paymentStatus}`;

    const orderStatusCell = row.getCell("orderStatus");
    orderStatusCell.value = `${order.orderStatus}`;

    const totalAmountCell = row.getCell("totalAmount");
    totalAmountCell.value = `${order.totalAmount}`;
  });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales_report.xlsx"
      );
      await workbook.xlsx.write(res);
      return res.end();
    }
    res.json({ orderData });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


 