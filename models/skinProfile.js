const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skinProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    age: {
        type: String,
    },
    skinFeel: {
        type: String
    },
    breakouts: {
        type: String
    },
    sensitivity: {
        type: String
    },
    concern: {
        type: String
    },
    brightness: {
        type: Number
    },
    redness: {
        type: Number
    },
    texture: {
        type: Number
    },
    oiliness:{
        type: Number
    }

});

const skinProfile = mongoose.model('SkinProfile', skinProfileSchema);

module.exports = skinProfile;

