const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

const createBill = async (req, res) => {
  try {
    const { customer, items, paidAmount } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        message: "Customer and items are required",
      });
    }

    const foundCustomer = await Customer.findById(customer);
    if (!foundCustomer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    let totalAmount = 0;
    const processedItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const quantity = item.quantity;

      if (product.quantity < quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      const price = product.price;

      totalAmount += price * quantity;

      processedItems.push({
        product: product._id,
        quantity,
        price,
      });

      product.quantity -= quantity;
      await product.save();
    }

    const paid = Number(paidAmount) || 0;

    if (paid < 0) {
      return res.status(400).json({
        message: "Paid amount must be 0 or greater",
      });
    }

    const previousPending = Number(foundCustomer.debt) || 0;
    const currentBillPending = Math.max(0, totalAmount - paid);
    const pendingPaid = Math.min(previousPending, Math.max(0, paid - totalAmount));
    const remainingAmount = Math.max(0, previousPending + totalAmount - paid);

    const bill = await Bill.create({
      customer,
      customerName: foundCustomer.name,
      items: processedItems,
      totalAmount,
      paidAmount: paid,
      remainingAmount,
      previousPending,
      pendingPaid,
      currentBillPending,
      user: req.user.id,
    });

    foundCustomer.debt = remainingAmount;
    await foundCustomer.save();

    res.status(201).json(bill);

  } catch (error) {
    console.error("Create Bill Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};




const getBills = async (req, res) => {
  try {
    const { customer, date } = req.query;

    // 🔥 BASE QUERY (important)
    let query = { user: req.user.id };

    // 🔹 FILTER BY CUSTOMER
    if (customer) {
      query.customer = customer;
    }

    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0); 

      const end = new Date(date);
      end.setHours(23, 59, 59, 999); 

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }
    const bills = await Bill.find(query)
      .populate("customer")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.status(200).json(bills);

  } catch (error) {
    console.error("Get Bills Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  createBill,
  getBills,
};