const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    unique: true,
    required: true,
  },
  couponType: {
    type: String,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  minimumPurchase: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
  redeemedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userCollection",
    },
  ],
});

const couponCollection = mongoose.model("couponCollection", couponSchema);

module.exports = couponCollection;