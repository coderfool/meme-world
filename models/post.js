const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    upvotes: [String],
    downvotes: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);