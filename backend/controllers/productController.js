const Product = require("../models/Product");



const addProduct = async (req, res) => {
  try {
    const { name, category, price, purchasePrice, quantity, unit } = req.body;

    if (!name || !category || !price || !purchasePrice || !quantity || !unit) {
      return res.status(400).json({
        message: "All fields are required (name, category, price, purchasePrice, quantity, unit)",
      });
    }

    const product = await Product.create({
      name,
      category,
      price,
      purchasePrice,
      quantity,
      unit,
      user: req.user.id,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { name, category, price, purchasePrice, quantity, unit } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (purchasePrice !== undefined) product.purchasePrice = purchasePrice; // 🔥 NEW
    if (quantity !== undefined) product.quantity = quantity;
    if (unit !== undefined) product.unit = unit;

    await product.save();

    res.status(200).json({
      message: "Product updated",
      product,
    });

  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await product.deleteOne();

    res.status(200).json({ message: "Product deleted" });

  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};