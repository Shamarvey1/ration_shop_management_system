const express = require('express');
const router = express.Router();
const {registerUser,loginUser} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile',protect,(req,res)=>{
    res.json({message:"This is a protected route", user:req.user});
}); 

module.exports = router;