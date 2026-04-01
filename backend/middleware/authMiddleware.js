const jwt = require('jsonwebtoken');

const protect = (req,res,next)=>{
    const token = req.headers.authorization?.split(" ")[1];
    if(token){
        try{
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch(err){
            res.status(401).json({message:"Token is invalid or expired"});
        }
    }
    else{
        res.status(401).json({message:"No token provided"});
    }
}

module.exports = protect;    