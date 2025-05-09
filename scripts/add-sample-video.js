const mongoose = require('mongoose');
const VideoModel = require('../models/video.js');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/cvmu_hackathon')
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Sample video data
const sampleVideo = {
    title: "Skincare Routine for Normal Skin",
    description: "Learn the perfect morning and evening skincare routine for normal skin types.",
    filename: "Normal Skin + General .mp4",
    path: "/uploads/videos/Normal Skin + General .mp4",
    skinType: "normal",
    concerns: [
        "General Maintenance",
        "Dark Spots & Uneven Tone"
    ]
};

// Add the sample video to the database
async function addSampleVideo() {
    try {
        const video = new VideoModel(sampleVideo);
        await video.save();
        console.log('Sample video added successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error adding sample video:', error);
        mongoose.connection.close();
    }
}

addSampleVideo(); 