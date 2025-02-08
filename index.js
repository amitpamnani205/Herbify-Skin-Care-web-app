const express = require("express");
const app = express();
let port = 8069;

const mongoose = require('mongoose');
const UserModel = require("./models/user.js");
const skinProfileModel = require("./models/skinProfile.js");

const session = require("express-session");
const passport = require("passport");


const LocalStrategy = require("passport-local");
const {isLoggedIn} = require("./middleware.js")
const userRouter = require("./routes/user.js");
const analyzeRouter = require("./routes/analyze.js");

const flash = require("connect-flash");

app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({limit: '50mb'}));

app.use(express.static('public'));
app.use(session({
    secret: "mysecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 1000 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}));

app.set("view engine", "ejs");


app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
    res.locals.errorMessage = req.flash("error");  // Store flash error messages
    next();
});


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/herbify')
  .then(() => console.log('Connected!'));



passport.use(new LocalStrategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());


app.use("/",userRouter);
app.use("/",analyzeRouter);

app.get("/", isLoggedIn, (req, res) => {
    res.send(`Welcome to your dashboard, ${req.user.username}!`);
});

// app.get("/analyze",isLoggedIn,(req,res) => {
//     console.log(req.user);
//     // res.send("slin analysis");

//     res.render("analysis/questions.ejs")
    
// });

// app.get("/analyze/face",isLoggedIn,(req,res) => {
//     res.render("analysis/scan.ejs")
// })



// let skinProfile = {
//     genralAnalysis: {},
//     faceAnalysis: {},
// };

// app.post('/analyze',isLoggedIn, (req, res) => {
//     const formData = req.body;
//     // console.log('Received data:', formData);

//     skinProfile.genralAnalysis = {
//         userId:req.user._id, 
//         age: formData.age, 
//         skinFeel: formData.skinFeel, 
//         breakouts: formData.breakouts, 
//         sensitivity: formData.sensitivity, 
//         concern: formData.concern
//     }

//     res.json({
//         success: true,
//         data: formData
//     });
// });



// app.post('/analyze/face', isLoggedIn, async (req, res) => {
//     const { imageData, analysisResults } = req.body;
//     // console.log(imageData, analysisResults);

//     skinProfile.faceAnalysis = { 
       
//         brightness: analysisResults.brightness, 
//         redness: analysisResults.redness, 
//         texture: analysisResults.texture, 
//         oiliness: analysisResults.oiliness
//     }

//         // console.log(skinProfile);

//     let newSkinProfile = new skinProfileModel({
//         userId: skinProfile.genralAnalysis.userId,
//         age: skinProfile.genralAnalysis.age,
//         skinFeel: skinProfile.genralAnalysis.skinFeel,
//         breakouts: skinProfile.genralAnalysis.breakouts,
//         sensitivity: skinProfile.genralAnalysis.sensitivity,
//         concern: skinProfile.genralAnalysis.concern,
//         brightness: skinProfile.faceAnalysis.brightness,
//         redness: skinProfile.faceAnalysis.redness,
//         texture: skinProfile.faceAnalysis.texture,
//         oiliness: skinProfile.faceAnalysis.texture
//     });

//     console.log(newSkinProfile);
//     await newSkinProfile.save();

// });


// }
app.listen(port,()=>{
    console.log(`server listing on port ${port}`);
});