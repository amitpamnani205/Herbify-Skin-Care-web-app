const skinProfileModel = require("./models/skinProfile");


let isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

let isfollower = async(req,res,next) => {
    let userId = req.user._id;
    let user = await skinProfileModel.findOne({ userId: userId});

    if(!user){
        return next()
    }
    res.redirect("/routine");
    
    
}


module.exports = { isLoggedIn,isfollower }