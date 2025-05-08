const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userQuestionnaireSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    age: {
        type: String,
        required: false,
        default: 'unknown'
    },
    skinFeel: {
        type: String,
        required: false,
        default: 'unknown'
    },
    breakouts: {
        type: String,
        required: false,
        default: 'unknown'
    },
    sensitivity: {
        type: String,
        required: false,
        default: 'unknown'
    },
    concern: {
        type: String,
        required: false,
        default: 'unknown'
    },
    rawAnswers: {
        type: Schema.Types.Mixed,
        required: false
    },
    isCompleted: {
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

// Update the updatedAt timestamp before saving
userQuestionnaireSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const UserQuestionnaire = mongoose.model('UserQuestionnaire', userQuestionnaireSchema);

module.exports = UserQuestionnaire; 