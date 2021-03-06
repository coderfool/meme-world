const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const multer = require('multer');
const Users = require('../models/user');
const Posts = require('../models/post');
const Comments = require('../models/comment');
const authenticate = require('../authenticate');
const path = require('path');
const passwordReset = require('../password-reset');

const router = express.Router();

router.use(bodyParser.json({ limit: '20mb' }));

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {fileSize: 8 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        const regex = /\.(jpg|jpeg|png)$/i;
        if (regex.test(file.originalname)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only jpg/jpeg/png images are allowed'), false);
        }
    }
});

router.get('/logout', authenticate.isLoggedIn, (req, res, next) => {
    req.logout();
    res.status(200).end();
});

router.post('/forgotPassword', (req, res, next) => {
    const token = passwordReset.generateResetToken(10);
    Users.findOne({email: req.body.email})
    .then(user => {
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }
        user.resetToken = token;
        user.tokenExp = Date.now() + 3600 * 1000;
        user.save()
        .then(user => {
            passwordReset.sendResetEmail({
                username: user.username, 
                email: user.email
            }, token)
            .then(resp => {
                res.status(200).end();
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.get('/resetPassword', (req, res, next) => {
    const token = req.query.token;
    passwordReset.validateToken(token)
    .then(user => {
        user.profilePic = (user.image === '' ? 'false' : 'true');
        res.render('reset-password-form', {
            layout: false,
            user: user,
            token: token
        });
    })
    .catch(err => {
        res.redirect('/');
    });
});

router.post('/resetPassword', (req, res, next) => {
    const token = req.query.token;
    passwordReset.validateToken(token)
    .then(user => {
        user.setPassword(req.body.password)
        .then(user => {
            user.resetToken = undefined;
            user.tokenExp = undefined;
            user.save()
            .then(user => {
                res.status(200).end();
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/:userId')
.get((req, res, next) => {
    Users.findById(req.params.userId)
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
        if (req.file) {
            req.body.image = req.file.buffer.toString('base64');
        }
        else if (req.body.image === 'null') {
            req.body.image = '';
        }
        Users.findByIdAndUpdate(req.user._id, {$set: req.body}, {new: true})
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
        .catch(err => {
            if (err.code === 11000) {
                const field = err.errmsg.indexOf('username') !== -1 ? 'Username' : 'Email'; 
                err = new Error(`${field} is taken`);
                err.status = 422;
            }
            next(err);
        });
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
        Posts.deleteMany({author: req.user._id})
        .then(resp => {
            Comments.deleteMany({author: req.user._id})
            .then(resp => {
                res.status(200).end();
            })
            .catch(err => next(err));
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
                user.image = req.file.buffer.toString('base64');  
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
        userId: req.user._id,
        token: token
    });
});

router.get('/verifyJWT/:jwt', (req, res, next) => {
    const payload = authenticate.getPayload(req.params.jwt);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    let expired = true;
    if (payload.exp > Date.now().valueOf() / 1000) {
        expired = false;
    }
    res.json({
        expired: expired,
    });
});

module.exports = router;