const express = require("express");
const engine = require("ejs-mate");
const app = express();
const path = require("path");
let port = 8069;

const mongoose = require('mongoose');
const UserModel = require("./models/user.js");


const session = require("express-session");
const passport = require("passport");


const LocalStrategy = require("passport-local");
const {isLoggedIn,isfollower} = require("./middleware.js")


const userRouter = require("./routes/user.js");
const analyzeRouter = require("./routes/analyze.js");
const landingController = require("./routes/landing.js")
const skinProfileModel = require("./models/skinProfile");

const flash = require("connect-flash");


app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({limit: '50mb'}));
app.set("views", path.join(__dirname, "views"));

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

app.engine('ejs', engine);
app.set("view engine", "ejs");


app.use(flash());





app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/herbify')
  .then(() => console.log('Connected!'));



passport.use(new LocalStrategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());


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

app.get("/test",(req,res) => {
    res.render("analysis/index.ejs")
})

app.post("/analyze", (req,res) => {
    let data = req.body;
    console.log(data);
    res.redirect("/routine")


    class SkinConcernAnalyzer {
        constructor() {
            this.skinConcerns = {
                oily: [
                    'Pimples & Acne',
                    'Dark Spots & Uneven Tone',
                    'Oily or Shiny Skin',    // Added as primary concern
                    'Redness & Irritation'
                ],
                dry: [
                    'Dry or Flaky Skin',     // Added as primary concern
                    'Fine Lines & Wrinkles',
                    'Redness & Sensitivity',
                    'Dark Spots & Uneven Tone'
                ],
                normal: [
                    'General Maintenance',
                    'Dark Spots & Uneven Tone',
                    'Fine Lines & Wrinkles'
                ],
                combination: [
                    'Oily T-zone & Dry Cheeks',
                    'Pimples & Acne',
                    'Dark Spots & Uneven Tone',
                    'Redness & Sensitivity'
                ]
            };
    
            // Adjusted weights to prioritize user input
            this.weights = {
                questionnaire: 0.8,  // Increased questionnaire weight
                scanData: 0.2       // Reduced scan data weight
            };
        }
    
        determineSkinType(scores, questionData) {
            let oilinessScore = 0;
            
            // Prioritize user-reported skin feel
            switch (questionData.skinFeel) {
                case 'oily':
                    oilinessScore += 80;  // Increased weight for user selection
                    break;
                case 'dry':
                    oilinessScore -= 80;  // Increased weight for user selection
                    break;
                case 'combination':
                    oilinessScore += 25;  // Moderate score for combination
                    break;
                case 'normal':
                    oilinessScore += 0;   // Neutral score for normal
                    break;
            }
    
            // Consider scan data with reduced weight
            const normalizedOiliness = ((scores.oiliness - 50) * 0.4);
            oilinessScore += normalizedOiliness;
    
            // Adjusted thresholds
            if (oilinessScore > 50) return 'oily';
            if (oilinessScore < -50) return 'dry';
            if (Math.abs(oilinessScore) <= 20) return 'normal';
            return 'combination';
        }
    
        analyzeConcerns(scanData, questionData) {
            const scores = {
                brightness: Math.min(100, Math.max(0, (scanData.brightness / 255) * 100)),
                sensitivity: Math.min(100, Math.max(0, scanData.redness * 35)),
                texture: Math.min(100, Math.max(0, scanData.texture)),
                oiliness: Math.min(100, Math.max(0, scanData.oiliness))
            };
    
            const skinType = this.determineSkinType(scores, questionData);
            const concerns = new Set();
    
            // Primary concern handling - respect user's main concern
            switch (questionData.concern) {
                case 'oiliness':
                    concerns.add('Oily or Shiny Skin');
                    // Only add acne if explicitly reported
                    if (questionData.breakouts === 'frequent') {
                        concerns.add('Pimples & Acne');
                    }
                    break;
                case 'dryness':
                    concerns.add('Dry or Flaky Skin');
                    break;
                case 'spots':
                    concerns.add('Dark Spots & Uneven Tone');
                    break;
                case 'aging':
                    concerns.add('Fine Lines & Wrinkles');
                    break;
                case 'redness':
                    concerns.add('Redness & Sensitivity');
                    break;
                case 'none':
                    concerns.add('General Maintenance');
                    break;
            }
    
            // Secondary concerns based on measurements - with strict conditions
            if (scores.sensitivity > 65 && questionData.sensitivity === 'very') {
                concerns.add('Redness & Sensitivity');
            }
    
            // Prevent contradictory concerns
            if (concerns.has('Oily or Shiny Skin')) {
                concerns.delete('Dry or Flaky Skin');
            }
            if (concerns.has('Dry or Flaky Skin')) {
                concerns.delete('Oily or Shiny Skin');
            }
    
            // Get valid concerns for the skin type
            const validConcerns = this.skinConcerns[skinType];
            
            // Filter and prioritize concerns
            const filteredConcerns = Array.from(concerns)
                .filter(concern => validConcerns.includes(concern))
                .sort((a, b) => {
                    // Prioritize the primary concern
                    if (a === this.getConcernFromUserInput(questionData.concern)) return -1;
                    if (b === this.getConcernFromUserInput(questionData.concern)) return 1;
                    return 0;
                });
    
            return {
                skinType,
                primaryConcern: questionData.concern,
                detectedConcerns: filteredConcerns,
                scores: {
                    sensitivity: Math.round(scores.sensitivity),
                    texture: Math.round(scores.texture),
                    oiliness: Math.round(scores.oiliness)
                }
            };
        }
    
        getConcernFromUserInput(userConcern) {
            const concernMap = {
                'oiliness': 'Oily or Shiny Skin',
                'dryness': 'Dry or Flaky Skin',
                'spots': 'Dark Spots & Uneven Tone',
                'aging': 'Fine Lines & Wrinkles',
                'redness': 'Redness & Sensitivity',
                'none': 'General Maintenance'
            };
            return concernMap[userConcern] || 'General Maintenance';
        }
    }
    
    // Example usage
    const analyzer = new SkinConcernAnalyzer();
    
    const scanData = {
        brightness: 58.94,
        redness: 6.09,
        texture: 23.5,
        oiliness: 23.5,
    };
    
    const questionData = {
        age: 'young',
        skinFeel: 'combination',           // User reports oily skin
        breakouts: 'frequent',         // No breakouts
        sensitivity: 'not',         // Not sensitive
        concern: 'spots'         // Primary concern is oiliness
    };
    
    const analysis = analyzer.analyzeConcerns(scanData, questionData);
    console.log('Skin Analysis:', JSON.stringify(analysis, null, 2));



})




app.use("/",userRouter);
app.use("/",analyzeRouter);
app.use("/",landingController);



app.get("/routine" ,isLoggedIn, async (req,res) => {

    res.send("routine")
})

app.get("/process", (req,res) => {
    res.render("analysis/process.ejs")
})

app.get("/survey", (req,res) => {
    res.render("analysis/survey.ejs")
})


app.listen(port,()=>{
    console.log(`server listing on port ${port}`);
});

