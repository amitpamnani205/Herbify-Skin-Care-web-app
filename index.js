const express = require("express");
const engine = require("ejs-mate");
const app = express();
const path = require("path");
let port = 8069;

const mongoose = require('mongoose');
const UserModel = require("./models/user.js");
const FaceAnalysisModel = require("./models/faceAnalysis.js");
const UserQuestionnaireModel = require("./models/userQuestionnaire.js");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const {isLoggedIn} = require("./middleware.js")

const userRouter = require("./routes/user.js");
const analyzeRouter = require("./routes/analyze.js");
const landingController = require("./routes/landing.js")
const skinProfileModel = require("./models/skinProfile");

const flash = require("connect-flash");

require('dotenv').config();

// Set up middleware
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({limit: '50mb'}));
app.set("views", path.join(__dirname, "views"));
app.use(express.static('public'));

// Session configuration
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

// Set up template engine
app.engine('ejs', engine);
app.set("view engine", "ejs");

// Flash messages
app.use(flash());

// Authentication setup
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch(err => console.error('MongoDB Atlas connection error:', err));

// Passport configuration
passport.use(new LocalStrategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// Set up locals for templates
app.use((req, res, next) => {
    res.locals.successMessage = req.flash("success");
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currUser = req.user;
    next();
});

app.use((req, res, next) => {
    res.locals.errorMessage = req.flash("error");
    next();
});

// Middleware to handle JSON requests
app.use((req, res, next) => {
    // Check if request expects JSON response
    const wantsJson = req.headers.accept && 
                     req.headers.accept.includes('application/json') ||
                     req.headers['content-type'] === 'application/json';
    
    // Store this for later use
    req.wantsJson = wantsJson;

    // Set JSON content type for API routes
    if (req.wantsJson) {
        res.setHeader('Content-Type', 'application/json');
    }
    
    next();
});

// Routes - Order matters!
app.use("/", analyzeRouter);  // Put analyze routes first
app.use("/", userRouter);
app.use("/", landingController);

// Test route
app.get("/test", (req, res) => {
    res.render("analysis/index.ejs")
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR] Global error handler:', err);
    
    // If the request wants JSON, send JSON error
    if (req.wantsJson || req.headers['content-type'] === 'application/json') {
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || "An unexpected error occurred"
        });
    }
    
    // Otherwise, render error page
    res.status(err.status || 500).render('error', { error: err });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 