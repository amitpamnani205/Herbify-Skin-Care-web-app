const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    skinType: {
        type: String,
        required: true,
        enum: ['oily', 'dry', 'normal', 'combination']
    },
    concerns: [{
        type: String,
        enum: [
            'Pimples & Acne',
            'Dark Spots & Uneven Tone',
            'Oily or Shiny Skin',
            'Redness & Irritation',
            'Dry or Flaky Skin',
            'Fine Lines & Wrinkles',
            'Redness & Sensitivity',
            'General Maintenance'
        ]
    }],
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Video', videoSchema); 