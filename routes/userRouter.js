const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const authenticate = require('../authenticate');
const router = express.Router();

router.use(bodyParser.json());

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const regex = /\.(jpg|jpeg|png|gif)$/i;
        if (regex.test(file.originalname)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only jpg/jpeg/png/gif files supported'), false);
        }
    }
});

router.post('/signup', upload.single('image'), (req, res, next) => {
    User.findOne({email: req.body.email})
    .then((user) => {
        if (user) {
            const error = new Error('A user with the given email ID is already registered');
            error.status = 403;
            return next(error);
        }
        else {
            const user = {
                username: req.body.username,
                email: req.body.email,
            };
            if (req.file) {
                user.image = req.file.buffer;
            }
            else {
                user.image = fs.readFileSync(path.join(appRoot, 'public/assets/images/user-default.png'));
            }
            User.register(new User(user), req.body.password)
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

router.get('/logout', authenticate.isLoggedIn, (req, res, next) => {
    res.redirect('/');
});

module.exports = router;
