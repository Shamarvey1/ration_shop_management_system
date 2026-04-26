const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const protect = require('./middleware/authMiddleware');
const connectDB = require('./config/db');
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes.js");
const billRoutes = require("./routes/billRoutes.js");
const reportRoutes = require("./routes/reportRoutes");

// Enable CORS with proper configuration
const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
connectDB();
app.use(express.json());
app.get('/',(req,res)=>{
    res.send("Welcome to the Inventory Management API");
})
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/reports", reportRoutes);
app.get("/api/test", protect , (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user,
  });
});
const port = process.env.PORT || 6000;
app.listen(port,()=>{
    console.log("Server is running on port",port);
})
