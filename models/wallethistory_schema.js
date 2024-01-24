const mongoose = require("mongoose");
const walletHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userCollection",
    required: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "walletCollection",
    required: true,
  },
  type: {
    type: String,
    enum: ["Purchase", "Return", "Referral Bonus"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
});

const walletHistoryCollection = mongoose.model("walletHistoryCollection", walletHistorySchema);
module.exports = walletHistoryCollection;
