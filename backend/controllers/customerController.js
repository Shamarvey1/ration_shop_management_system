const Customer = require("../models/Customer");

const addCustomer = async(req,res)=>{
    try{
        const{name,phone,address} = req.body;

        if(!name || !phone){
            return res.status(400).json({message:"Name and phone are required"});
        }
        const customer = await Customer.create({
            name,phone,address,
            user:req.user.id
        });
        res.status(201).json(customer);
    }catch(error){
        console.error("Add Customer Error:",error);
        res.status(500).json({message:"Server error"});
    }
}                       


const getCustomers = async(req,res)=>{
    try{
        const customers = await Customer.find({user:req.user.id}).sort({createdAt:-1});
        res.status(200).json(customers);    
    }catch(error){
        console.error("Get Customers Error:",error);
        res.status(500).json({message:"Server error"});
    }   
}


const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (customer.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    await customer.deleteOne();
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  addCustomer,
  getCustomers,
  deleteCustomer,
};