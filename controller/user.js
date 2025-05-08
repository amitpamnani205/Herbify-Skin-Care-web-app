const express = require("express");
const router = express.Router();
const passport = require("passport");
const UserModel = require("../models/user.js");
const flash = require("connect-flash");



const renderSignUp = ("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});

const signUpUser = ("/signup",async(req,res) => {
    try {
        const { username,fullname, email, password } = req.body;
        const user = new UserModel({ username,fullname, email });
        console.log(user);
        await UserModel.register(user, password);
        res.redirect("/");
    } catch (err) {

        // res.render("users/signup.ejs", { err.message });
        res.render("users/signup", { errorMessage: err.message });
    }
});

const renderLogin = ("/login", (req, res) => {
    res.render("users/login.ejs");
});

const loginUser = ("/login", passport.authenticate("local", {
    successRedirect: "/", // Redirect to dashboard on success
    failureRedirect: "/login",    // Redirect back to login on failure
    failureFlash: true,
}
    
));

const logoutUser = ("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/login");
        req.flash('success', 'Goodbye!');
    });
});

module.exports = { renderSignUp,signUpUser,renderLogin,loginUser,logoutUser };

