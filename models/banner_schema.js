const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    status: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("bannerCollection", bannerSchema);
