var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    img:
    {
        data: Buffer,
        contentType: String
    }
});

//Image is a model which has a schema imageSchema

module.exports = new mongoose.model('Image', imageSchema);