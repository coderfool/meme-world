const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Users', userSchema);