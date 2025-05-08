const express = require("express");
const router = express.Router();
const analyzeController = require("../controller/analyze.js")
const {isLoggedIn} = require("../middleware.js")

// Middleware to ensure JSON responses for API routes
const ensureJson = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
};

// Process route (HTML response)
router.get("/process", isLoggedIn, analyzeController.renderProcess);

// Question route (HTML response)
router.get("/analyze", isLoggedIn, analyzeController.renderQuestion);

// Save questionnaire route (JSON response)
router.post("/analyze", 
    isLoggedIn, 
    ensureJson,
    (req, res, next) => {
        console.log('[DEBUG] POST /analyze - Headers:', req.headers);
        console.log('[DEBUG] POST /analyze - Body:', req.body);
        next();
    },
    analyzeController.saveGenralAnalysis
);

// Face analysis routes
router.get("/analyze/face", isLoggedIn, analyzeController.renderCamera);
router.post("/analyze/face", isLoggedIn, ensureJson, analyzeController.saveFaceAnalysis);

// API endpoint to check analysis status
router.get("/api/checkAnalysisStatus", isLoggedIn, ensureJson, analyzeController.checkAnalysisStatus);

// Error handler for JSON routes
router.use((err, req, res, next) => {
    console.error('[ERROR] Route error:', err);
    res.status(500).json({
        success: false,
        message: err.message || "An unexpected error occurred"
    });
});

module.exports = router;