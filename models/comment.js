const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    postId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    image: {
        type: Buffer
    },
    upvotes: [String],
    downvotes: [String]
});

module.exports = mongoose.model('Comment', commentSchema);