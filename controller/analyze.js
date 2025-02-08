
const skinProfileModel = require("../models/skinProfile.js");



const renderQuestion = ("/analyze",(req,res) => {
    console.log(req.user);
    // res.send("slin analysis");

    res.render("analysis/questions.ejs")
    
});


const renderCamera = ("/analyze/face",(req,res) => {
    res.render("analysis/scan.ejs")
});


let skinProfile = {
    genralAnalysis: {},
    faceAnalysis: {},
};

const saveGenralAnalysis = ('/analyze', (req, res) => {
    const formData = req.body;
    // console.log('Received data:', formData);

    skinProfile.genralAnalysis = {
        userId:req.user._id, 
        age: formData.age, 
        skinFeel: formData.skinFeel, 
        breakouts: formData.breakouts, 
        sensitivity: formData.sensitivity, 
        concern: formData.concern
    }

    res.json({
        success: true,
        data: formData
    });
});

const saveFaceAnalysis = ('/analyze/face', async (req, res) => {
    const { imageData, analysisResults } = req.body;
    // console.log(imageData, analysisResults);

    skinProfile.faceAnalysis = { 
       
        brightness: analysisResults.brightness, 
        redness: analysisResults.redness, 
        texture: analysisResults.texture, 
        oiliness: analysisResults.oiliness
    }

        // console.log(skinProfile);

    let newSkinProfile = new skinProfileModel({
        userId: skinProfile.genralAnalysis.userId,
        age: skinProfile.genralAnalysis.age,
        skinFeel: skinProfile.genralAnalysis.skinFeel,
        breakouts: skinProfile.genralAnalysis.breakouts,
        sensitivity: skinProfile.genralAnalysis.sensitivity,
        concern: skinProfile.genralAnalysis.concern,
        brightness: skinProfile.faceAnalysis.brightness,
        redness: skinProfile.faceAnalysis.redness,
        texture: skinProfile.faceAnalysis.texture,
        oiliness: skinProfile.faceAnalysis.texture
    });

    console.log(newSkinProfile);
    await newSkinProfile.save();

});

module.exports = { renderQuestion, renderCamera,saveGenralAnalysis,saveFaceAnalysis }


