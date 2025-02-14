

const FaceAnalysisModel = require("../models/faceAnalysis.js");


const renderQuestion = ("/analyze",(req,res) => {
    console.log(req.user);
    // res.send("slin analysis");

    res.render("analysis/questions.ejs")
    
});


const renderCamera = ("/analyze/face",(req,res) => {
    res.render("analysis/scan.ejs")
});


// let skinProfile = {
//     genralAnalysis: {},
//     faceAnalysis: {},
// };

// const saveGenralAnalysis = ('/analyze', (req, res) => {
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

const saveFaceAnalysis = ('/analyze/face', async (req, res) => {
    const { imageData,analysisResults } = req.body;
    let userId = req.user._id;
    console.log(analysisResults.brightness,req.user);

    let newFaceScan = new FaceAnalysisModel({
        userId: userId,
        brightness: analysisResults.brightness,
        redness: analysisResults.redness,
        texture: analysisResults.texture,
        oiliness: analysisResults.texture,
        isDone: true
    })

    // skinProfile.faceAnalysis = { 
       
    //     brightness: analysisResults.brightness, 
    //     redness: analysisResults.redness, 
    //     texture: analysisResults.texture, 
    //     oiliness: analysisResults.oiliness
    // }

        // console.log(skinProfile);

    // let newFaceScan = new skinProfileModel({
    //     userId: skinProfile.genralAnalysis.userId,
    //     brightness: skinProfile.faceAnalysis.brightness,
    //     redness: skinProfile.faceAnalysis.redness,
    //     texture: skinProfile.faceAnalysis.texture,
    //     oiliness: skinProfile.faceAnalysis.texture
    // });

    console.log(newFaceScan);
    await newFaceScan.save();

});

module.exports = { renderQuestion, renderCamera,saveFaceAnalysis }


