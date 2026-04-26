const jwt = require('jsonwebtoken')
const bycrypt = require('bcryptjs')
const User = require('../models/user')

const generateToken = (id)=>{
    return jwt.sign({id:id},process.env.JWT_SECRET,{expiresIn:'10d'})
    }
const registerUser = async (req,res)=>{
    const {shopName,ownerName,email,password} = req.body;
    try{
        const userExists = await User.findOne({email})
    if (userExists){
        return res.status(400).json({message:"User already exists"})
    }
    const hashedPassword = await bycrypt.hash(password,10)
    const user = await User.create({
        shopName,
        ownerName,
        email,
        password:hashedPassword
    })
    res.json({
        id:user._id,
        email:user.email,
        token:generateToken(user._id)

    })
}
catch(error){
    res.status(500).json({message:"Server Error"})
}
}

const loginUser = async(req,res)=>{
    const {email,password} = req.body;
    try{
        if(!email || !password) {
            return res.status(400).json({message:"Email and password are required"})
        }
        const user = await User.findOne({email})
        if(user){
            const isMatch = await bycrypt.compare(password,user.password)
            if(isMatch){
                res.json({
                    id:user._id,
                    email:user.email,
                    token:generateToken(user._id)
                })
            }else{
                res.status(401).json({message:"Invalid Password"})
            }
        }else{
            res.status(404).json({message:"Invalid Credentials"})
        }
    }catch(error){
        console.error("Login error:", error);
        res.status(500).json({message:"Server Error", error: error.message})
    }
}

module.exports = {registerUser,loginUser}