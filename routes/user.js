const express = require("express");
const router = express.Router();
const userController = require("../controller/user")

router
    .route("/signup")
    .get(userController.renderSignUp)
    .post(userController.signUpUser)
    
router
    .route("/login")
    .get(userController.renderLogin)
    .post(userController.loginUser)


router
    .route("/logout")
    .get(userController.logoutUser)

module.exports = router;
