const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const faceScanSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    brightness: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    redness: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    texture: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    oiliness: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    isDone: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add validation to ensure all required metrics are present
faceScanSchema.pre('save', function(next) {
    if (this.isDone) {
        // When marking as done, ensure all metrics are present and valid
        if (!this.brightness || !this.redness || !this.texture || !this.oiliness) {
            next(new Error('All metrics (brightness, redness, texture, oiliness) are required when marking scan as done'));
            return;
        }
        
        // Ensure all metrics are within valid range
        const metrics = [this.brightness, this.redness, this.texture, this.oiliness];
        for (const metric of metrics) {
            if (metric < 0 || metric > 100) {
                next(new Error('All metrics must be between 0 and 100'));
                return;
            }
        }
    }
    
    this.updatedAt = Date.now();
    next();
});

const FaceScan = mongoose.model('FaceScan', faceScanSchema);

module.exports = FaceScan;