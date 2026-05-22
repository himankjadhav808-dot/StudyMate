const express = require('express')
const router = express.Router()
require('dotenv').config()

const { SECRET_KEY } = process.env

const jwt = require('jsonwebtoken')

const signupController = require('../controller/signup')
const { signupUser, signupAdmin } = require('../controller/signupEnhanced')
const verifyController = require('../controller/verify')
const loginController = require('../controller/login')
const logoutController = require('../controller/logout')

router.post("/signup", signupController.saveRecord)
router.post("/signup/user", signupUser)
router.post("/signup/admin", signupAdmin)
router.post("/resend-otp", signupController.resendOTP)
router.post("/verify", verifyController.verifyOTP)
router.post("/login", loginController.login)

router.post('/auth', (req, res) => {
    const {token} = req.cookies
    if(!token) return res.json({success: false, message: 'session ended'})
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(200).json({success: false, message: 'invalid or expired token'})
        return res.status(200).json({success: true, decoded})
    })
})

router.get("/learner/logout",logoutController.doLogOut)


module.exports = router