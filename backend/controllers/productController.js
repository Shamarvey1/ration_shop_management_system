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
    const category = (req.query.category || "").trim();
    const search = (req.query.search || "").trim();
    const pageQuery = Number.parseInt(req.query.page, 10);
    const limitQuery = Number.parseInt(req.query.limit, 10);
    const hasPagination = Number.isInteger(pageQuery) || Number.isInteger(limitQuery);
    const page = Number.isInteger(pageQuery) && pageQuery > 0 ? pageQuery : 1;
    const limit = Number.isInteger(limitQuery) && limitQuery > 0 ? Math.min(limitQuery, 100) : 20;

    const query = { user: req.user.id };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (!hasPagination) {
      const products = await Product.find(query).sort({ createdAt: -1 });
      return res.status(200).json(products);
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
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
    if (purchasePrice !== undefined) product.purchasePrice = purchasePrice; 
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