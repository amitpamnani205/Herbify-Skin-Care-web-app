const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const genralScanSchema = new Schema({
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
    isDone: {
        type: Boolean,
        default: false
    }

});



const GenralAnalysis = mongoose.model('GenralAnalysis', genralScanSchema);

module.exports = GenralAnalysis;