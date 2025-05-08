const FaceAnalysisModel = require("../models/faceAnalysis.js");
const UserQuestionnaireModel = require("../models/userQuestionnaire.js");

// Add renderProcess function to render the process page
const renderProcess = async (req, res) => {
    try {
        console.log("Rendering process page");
        // Simple render - the process page now handles all status checking via API
        res.render('analysis/process.ejs');
    } catch (error) {
        console.error("Error rendering process page:", error);
        res.status(500).send("Something went wrong while loading your page. Please try again later.");
    }
};

const renderQuestion = async (req, res) => {
    console.log(req.user);
    
    try {
        // Check if the user has already completed the questionnaire
        const questionnaire = await UserQuestionnaireModel.findOne({ userId: req.user._id });
        const hasCompletedQuestionnaire = !!questionnaire;
        
        // Pass the status to the view
        res.render("analysis/index.ejs", {
            hasCompletedQuestionnaire
        });
    } catch (error) {
        console.error("Error rendering question page:", error);
        res.status(500).send("Something went wrong");
    }
};

const renderCamera = async (req, res) => {
    try {
        // Check if the user has already completed the questionnaire
        const questionnaire = await UserQuestionnaireModel.findOne({ userId: req.user._id });
        const hasCompletedQuestionnaire = !!questionnaire;
        
        // If questionnaire not completed, redirect to process page
        if (!hasCompletedQuestionnaire) {
            req.flash('error', 'Please complete the questionnaire first');
            return res.redirect('/process');
        }
        
        // Check if face scan already exists
        const faceScan = await FaceAnalysisModel.findOne({ userId: req.user._id, isDone: true });
        const hasFaceScan = !!faceScan;
        
        res.render("analysis/scan.ejs", { hasFaceScan });
    } catch (error) {
        console.error("Error rendering camera page:", error);
        res.status(500).send("Something went wrong");
    }
};

const saveGenralAnalysis = async (req, res) => {
    try {
        // Set content type header for JSON
        res.setHeader('Content-Type', 'application/json');
        
        console.log('[DEBUG] saveGenralAnalysis - Starting...');
        console.log('[DEBUG] saveGenralAnalysis - User:', req.user?._id);
        console.log('[DEBUG] saveGenralAnalysis - Body:', JSON.stringify(req.body, null, 2));

        // Check if user is logged in
        if (!req.user) {
            console.log('[ERROR] saveGenralAnalysis - No user found');
            return res.status(401).json({
                success: false,
                message: "Please log in to save your questionnaire"
            });
        }

        // Validate request body
        if (!req.body || !req.body.answers) {
            console.log('[ERROR] saveGenralAnalysis - No answers in request body');
            return res.status(400).json({
                success: false,
                message: "No answers provided"
            });
        }

        const answers = req.body.answers;
        console.log('[DEBUG] saveGenralAnalysis - Processing answers:', JSON.stringify(answers, null, 2));

        // Map answers to database fields
        const formData = {
            userId: req.user._id,
            age: answers['How old are you?'] || 'unknown',
            skinFeel: answers['How would you describe your skin at the end of the day?'] || 'unknown',
            breakouts: answers['Do you get pimples or spots?'] || 'unknown',
            sensitivity: answers['Does your skin easily become red or irritated?'] || 'unknown',
            concern: answers['What bothers you most about your skin?'] || 'unknown',
            rawAnswers: answers,
            isCompleted: true
        };

        console.log('[DEBUG] saveGenralAnalysis - Form data:', JSON.stringify(formData, null, 2));

        // Find existing questionnaire or create new one
        let questionnaire = await UserQuestionnaireModel.findOne({ userId: req.user._id });

        if (questionnaire) {
            console.log('[DEBUG] saveGenralAnalysis - Updating existing questionnaire');
            Object.assign(questionnaire, formData);
        } else {
            console.log('[DEBUG] saveGenralAnalysis - Creating new questionnaire');
            questionnaire = new UserQuestionnaireModel(formData);
        }

        // Save the questionnaire
        await questionnaire.save();
        console.log('[DEBUG] saveGenralAnalysis - Questionnaire saved successfully');

        // Prepare response
        const response = {
            success: true,
            message: "Questionnaire saved successfully",
            redirect: '/process?from=questionnaire'
        };

        console.log('[DEBUG] saveGenralAnalysis - Sending response:', JSON.stringify(response, null, 2));
        
        // Send JSON response
        return res.status(200).json(response);

    } catch (error) {
        console.error('[ERROR] saveGenralAnalysis - Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred"
        });
    }
};

const saveFaceAnalysis = async (req, res) => {
    try {
        const { imageData, analysisResults } = req.body;
        let userId = req.user._id;
        
        console.log('[DEBUG] saveFaceAnalysis - Starting face analysis save for user:', userId);
        console.log('[DEBUG] saveFaceAnalysis - Analysis results:', JSON.stringify(analysisResults, null, 2));

        // Validate analysis results
        if (!analysisResults || !analysisResults.brightness || !analysisResults.redness || 
            !analysisResults.texture || !analysisResults.oiliness) {
            console.error('[ERROR] saveFaceAnalysis - Missing required metrics in analysis results');
            return res.status(400).json({
                success: false,
                message: "Missing required metrics in analysis results"
            });
        }

        // Check if face scan already exists
        let existingFaceScan = await FaceAnalysisModel.findOne({ userId: userId });
        console.log('[DEBUG] saveFaceAnalysis - Existing face scan:', existingFaceScan);
        
        try {
            if (existingFaceScan) {
                // Update existing face scan
                console.log('[DEBUG] saveFaceAnalysis - Updating existing face scan');
                existingFaceScan.brightness = analysisResults.brightness;
                existingFaceScan.redness = analysisResults.redness;
                existingFaceScan.texture = analysisResults.texture;
                existingFaceScan.oiliness = analysisResults.oiliness;
                existingFaceScan.isDone = true;
                
                await existingFaceScan.save();
                console.log('[DEBUG] saveFaceAnalysis - Updated face scan successfully');
            } else {
                // Create new face scan
                console.log('[DEBUG] saveFaceAnalysis - Creating new face scan');
                let newFaceScan = new FaceAnalysisModel({
                    userId: userId,
                    brightness: analysisResults.brightness,
                    redness: analysisResults.redness,
                    texture: analysisResults.texture,
                    oiliness: analysisResults.oiliness,
                    isDone: true
                });
                
                await newFaceScan.save();
                console.log('[DEBUG] saveFaceAnalysis - Created new face scan successfully');
            }
        } catch (dbError) {
            console.error('[ERROR] saveFaceAnalysis - Database error:', dbError);
            throw new Error('Failed to save face scan: ' + dbError.message);
        }
        
        // Return JSON response
        console.log('[DEBUG] saveFaceAnalysis - Sending success response');
        return res.status(200).json({
            success: true,
            message: "Face scan saved successfully",
            redirect: '/process'
        });
    } catch (error) {
        console.error("[ERROR] Error saving face analysis:", error);
        return res.status(500).json({
            success: false,
            message: "Error saving face analysis: " + error.message
        });
    }
};

// Add a new function to check analysis status
const checkAnalysisStatus = async (req, res) => {
    try {
        // User must be logged in to check status
        if (!req.user) {
            console.log('[DEBUG] checkAnalysisStatus - No user found in request');
            return res.status(401).json({
                questionnaireCompleted: false,
                faceScanCompleted: false,
                message: "User not logged in"
            });
        }

        console.log('[DEBUG] checkAnalysisStatus - Checking status for user:', req.user._id);

        // Check if questionnaire exists and is completed in database
        const questionnaire = await UserQuestionnaireModel.findOne({ 
            userId: req.user._id,
            isCompleted: true 
        });
        const questionnaireCompleted = !!questionnaire;
        console.log('[DEBUG] checkAnalysisStatus - Questionnaire completed:', questionnaireCompleted);
        
        // Check if face scan exists and is completed in database
        const faceScan = await FaceAnalysisModel.findOne({ 
            userId: req.user._id,
            isDone: true,
            $and: [
                { brightness: { $exists: true, $ne: null } },
                { redness: { $exists: true, $ne: null } },
                { texture: { $exists: true, $ne: null } },
                { oiliness: { $exists: true, $ne: null } }
            ]
        });
        const faceScanCompleted = !!faceScan;
        console.log('[DEBUG] checkAnalysisStatus - Face scan completed:', faceScanCompleted);
        
        if (faceScan) {
            console.log('[DEBUG] checkAnalysisStatus - Face scan metrics:', {
                brightness: faceScan.brightness,
                redness: faceScan.redness,
                texture: faceScan.texture,
                oiliness: faceScan.oiliness
            });
        }

        // Send detailed response
        const response = {
            questionnaireCompleted,
            faceScanCompleted,
            userData: {
                hasQuestionnaire: questionnaireCompleted,
                hasFaceScan: faceScanCompleted
            },
            message: "Analysis status retrieved successfully"
        };
        
        console.log('[DEBUG] checkAnalysisStatus - Sending response:', JSON.stringify(response, null, 2));
        return res.status(200).json(response);
    } catch (error) {
        console.error("[ERROR] Error checking analysis status:", error);
        return res.status(500).json({
            questionnaireCompleted: false,
            faceScanCompleted: false,
            message: "Error checking analysis status: " + error.message
        });
    }
};

module.exports = {
    renderQuestion,
    saveGenralAnalysis,
    renderCamera,
    saveFaceAnalysis,
    renderProcess,
    checkAnalysisStatus
};


