const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const faceScanSchema = new Schema({
 
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
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
    },
    isDone: {
        type: Boolean,
        default: false
    }

});



const FaceScan = mongoose.model('FaceScan', faceScanSchema);

module.exports = FaceScan;