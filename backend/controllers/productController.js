const Product = require("../models/Product");


const addProduct = async (req, res) => {
  try {
    const { name, category, price, quantity, unit } = req.body;

    if (!name || !category || !price || !quantity || !unit) {
      return res.status(400).json({ message: "All fields are required (name, category, price, quantity, unit)" });
    }

    const product = await Product.create({
      name,
      category,
      price,
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



// 🟢 GET ALL PRODUCTS (only for logged-in user)
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// 🟢 UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { name, category, price, quantity, unit } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // check ownership (VERY IMPORTANT)
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update only provided fields
    if (name !== null) product.name = name;
    if (category !== null) product.category = category;
    if (price !== null) product.price = price;
    if (quantity !== null) product.quantity = quantity;
    if (unit !== null) product.unit = unit;

    await product.save();

    res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // check ownership (VERY IMPORTANT)
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