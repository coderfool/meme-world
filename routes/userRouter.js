const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const authenticate = require('../authenticate');
const router = express.Router();

router.use(bodyParser.json());

router.post('/signup', (req, res, next) => {
    User.findOne({email: req.body.email})
    
    .then((user) => {
        if (user) {
            const error = new Error('A user with the given email ID is already registered');
            error.status = 403;
            return next(error);
        }
        else {
            User.register(new User({
                username: req.body.username,
                email: req.body.email
            }), req.body.password)
            
            .then((user) => {
                user.save()

                .then((user) => {
                    passport.authenticate('local')(req, res, () => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({success: true});
                    });
                })

                .catch((err) => next(err));
            })

            .catch((err) => next(err));
        }
    })

    .catch((err) => next(err));
}); 

router.post('/login', passport.authenticate('local', {session: false}), (req, res) => {
    const token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({
        success: true,
        token: token
    });
});

router.get('/logout', (req, res, next) => {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (!token) {
        const err = new Error('You are not logged in');
        err.status = 403;
        return next(err);
    }
    else {
        authenticate.verifyToken(token);
        res.redirect('/');
    }
});

module.exports = router;
