const express = require("express");
const router = express.Router();
const analyzeController = require("../controller/analyze.js")
const {isLoggedIn} = require("../middleware.js")

router
    .route("/analyze")
    .get(isLoggedIn,analyzeController.renderQuestion)
    .post(isLoggedIn,analyzeController.saveGenralAnalysis)

router
    .route("/analyze/face")
    .get(isLoggedIn,analyzeController.renderCamera)
    .post(isLoggedIn,analyzeController.saveFaceAnalysis)


module.exports = router