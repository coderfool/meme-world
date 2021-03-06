const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./config');
const Users = require('./models/user');

passport.use(new LocalStrategy(Users.authenticate()));

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

passport.use(new JwtStrategy(opts, (payload, done) => {
    Users.findOne({_id: payload._id}, (err, user) => {
        if (err) {
            return done(err, false);
        }
        else if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    });
}));

module.exports.getToken = (user) => {
    return jwt.sign(user, config.secretKey, {expiresIn: '1d'});
};

module.exports.getPayload = (token) => {
    return jwt.verify(token, config.secretKey);
};

module.exports.isLoggedIn = passport.authenticate('jwt', {session: false});