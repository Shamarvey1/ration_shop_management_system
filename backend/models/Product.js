const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: ['Grains', 'Pulses', 'Spices', 'Oils', 'Sugars', 'Dairy', 'Beverages', 'Other'],
    },

    price: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      required: true,
      enum: ['kg', 'litre', 'gram', 'ml', 'piece', 'packet', 'box', 'can'],
    },


    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;