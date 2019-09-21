const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    postId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    author: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    upvotes: [String],
    downvotes: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);