const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Users = require('../models/user');
const authenticate = require('../authenticate');
const passwordReset = require('../password-reset');

const router = express.Router();

router.use(bodyParser.json());

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {fileSize: 15 * 1024 * 1024},
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

router.route('/:userId')
.get((req, res, next) => {
    Users.findById(req.user._id)
    .then(user => {
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
    })
    .catch(err => next(err));
})

.put(authenticate.isLoggedIn, upload.single('image'), (req, res, next) => {
    if (String(req.user._id) !== req.params.userId) {
        const err = new Error('Forbidden');
        err.status = 403;
        return next(err);
    }
    Users.findById(req.user._id)
    .then(user => {
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }
        const update = {};
        if (req.file) {
            update.image = req.file.buffer;
        }
        Users.findByIdAndUpdate(req.user._id, {$set: update}, {new: true})
        .then(user => {
            if (req.body.oldPassword && req.body.newPassword) {
                user.changePassword(req.body.oldPassword, req.body.newPassword)
                .then(user => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                })
                .catch(err => next(err));
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user); 
            }
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));    
})

.delete(authenticate.isLoggedIn, (req, res, next) => {
    if (String(req.user._id) !== req.params.userId) {
        const err = new Error('Forbidden');
        err.status = 403;
        return next(err);
    }
    Users.findByIdAndDelete(req.user._id)
    .then(resp => {
        res.status(200).end();
    })
    .catch(err => next(err));
});

router.get('/:userId/resetPassword', authenticate.isLoggedIn, (req, res, next) => {
    Users.findById(req.user._id)
    .then(user => {
        passwordReset.resetAndEmail(user)
        .then(info => {
            res.status(200).end();
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.post('/signup', upload.single('image'), (req, res, next) => {
    Users.findOne({email: req.body.email})
    .then(user => {
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
            Users.register(new Users(user), req.body.password)
            .then(user => {
                user.save()
                .then(user => {
                    passport.authenticate('local')(req, res, () => {
                        res.status(200).end();
                    });
                })
                .catch(err => next(err));
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
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
    req.logout();
    res.redirect('/');
});

module.exports = router;