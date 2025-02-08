const express = require("express");
const router = express.Router();
const analyzeController = require("../controller/analyze.js")
const {isLoggedIn,isfollower} = require("../middleware.js")

router
    .route("/analyze")
    .get(isLoggedIn,isfollower,analyzeController.renderQuestion)
    .post(isLoggedIn,isfollower,analyzeController.saveGenralAnalysis)

router
    .route("/analyze/face")
    .get(isLoggedIn,isfollower,analyzeController.renderCamera)
    .post(isLoggedIn,isfollower,analyzeController.saveFaceAnalysis)


module.exports = router