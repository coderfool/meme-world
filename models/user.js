const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    resetToken: String,
    tokenExp: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Users', userSchema);