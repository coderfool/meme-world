const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const Posts = require('../models/post');
const Users = require('../models/user');
const Comments = require('../models/comment');
const authenticate = require('../authenticate');
const router = express.Router();

router.use(bodyParser.json({limit: '20mb'}));

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

router.get('/index/:index', (req, res, next) => {
    Posts.find({})
    .then(allPosts => {
        const index = parseInt(req.params.index);
        let posts = allPosts.slice(index, index + 5);
        let promises = [];
        for (let i = 0; i < posts.length; i++) {
            promises.push(Comments.find({postId: posts[i]._id}));
        }
        Promise.all(promises)
        .then(comments => {
            for (let i = 0; i < comments.length; i++) {
                posts[i].set('commentCount', comments[i].length, Number, {strict: false});
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(posts);
        })
        .catch(err => {
            next(err);
        });
    })
    .catch(err => {
        next(err);
    });
});

router.route('/')
.post(authenticate.isLoggedIn, upload.single('image'), (req, res, next) => {
    Posts.create({
        title: req.body.title,
        image: req.file.buffer.toString('base64'),
        author: String(req.user._id)
    })
    .then(post => {
        post.set('commentCount', 0, Number, {strict: false});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(post);
    })
    .catch(err => next(err));
});

router.route('/:postId')
.get((req, res, next) => {
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(post);
    })
    .catch(err => next(err)); 
})

.put(authenticate.isLoggedIn, (req, res, next) => {
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        if (String(req.user._id) !== post.author) {
            const err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        Posts.findByIdAndUpdate(req.params.postId, {
            $set: req.body
        }, {new: true})
        .then(post => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(post);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err))
})

.delete(authenticate.isLoggedIn, (req, res, next) => {
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        if (String(req.user._id) !== post.author) {
            const err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        Posts.findByIdAndDelete(req.params.postId)
        .then(resp => {
            Comments.deleteMany({postId: req.params.postId})
            .then(resp => {
                res.status(200).end();
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/:postId/comments')
.get((req, res, next) => {
    Comments.find({postId: req.params.postId})
    .then(comments => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(comments);
    })
    .catch(err => next(err));
})

.post(authenticate.isLoggedIn, upload.single('image'), (req, res, next) => {
    if (!req.body.text && !req.file) {
        const err = new Error('Comment cannot be empty');
        err.status = 403;
        return next(err);
    }
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        Users.findById(req.user._id)
        .then(user => {
            if (!user) {
                const err = new Error('Post not found');
                err.status = 404;
                return next(err);
            }
            const comment = {
                postId: post._id,
                author: String(user._id),
                username: user.username,
            };
            if (req.body.text) {
                comment.text = req.body.text;
            }
            if (req.file) {
                comment.image = req.file.buffer.toString('base64');
            }
            if (user.image) {
                comment.profilePic = user.image
            }
            
            Comments.create(comment)
            .then(comment => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(comment);
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/comments/:commentId')
.put(authenticate.isLoggedIn, upload.single('image'), (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        if (String(req.user._id) !== comment.author) {
            const err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        req.body.image = req.file ? req.file.buffer.toString('base64') : ''; 
        Comments.findByIdAndUpdate(req.params.commentId, {
            $set: req.body
        }, {new: true})
        .then(comment => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(comment);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err))
})

.delete(authenticate.isLoggedIn, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        if (String(req.user._id) !== comment.author) {
            const err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        Comments.findByIdAndDelete(req.params.commentId)
        .then(resp => {
            res.status(200).end();
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/:postId/upvote')
.get(authenticate.isLoggedIn, (req, res, next) => {
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        const userIndex = post.upvotes.indexOf(req.user._id);
        if (userIndex === -1) {
            post.upvotes.push(req.user._id);
            const downvoteIndex = post.downvotes.indexOf(req.user._id);
            if (downvoteIndex !== -1) {
                post.downvotes.splice(downvoteIndex, 1);
            }
        }
        else {
            post.upvotes.splice(userIndex, 1);
        }
        post.save()
        .then(post => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(post);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/:postId/downvote')
.get(authenticate.isLoggedIn, (req, res, next) => {
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        const userIndex = post.downvotes.indexOf(req.user._id);
        if (userIndex === -1) {
            post.downvotes.push(req.user._id);
            const upvoteIndex = post.upvotes.indexOf(req.user._id);
            if (upvoteIndex !== -1) {
                post.upvotes.splice(upvoteIndex, 1);
            }
        }
        else {
            post.downvotes.splice(userIndex, 1);
        }
        post.save()
        .then(post => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(post);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/comments/:commentId/upvote')
.get(authenticate.isLoggedIn, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        const userIndex = comment.upvotes.indexOf(req.user._id);
        if (userIndex === -1) {
            comment.upvotes.push(req.user._id);
            const downvoteIndex = comment.downvotes.indexOf(req.user._id);
            if (downvoteIndex !== -1) {
                comment.downvotes.splice(downvoteIndex, 1);
            }
        }
        else {
            comment.upvotes.splice(userIndex, 1);
        }
        comment.save()
        .then(comment => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(comment);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/comments/:commentId/downvote')
.get(authenticate.isLoggedIn, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        const userIndex = comment.downvotes.indexOf(req.user._id);
        if (userIndex === -1) {
            comment.downvotes.push(req.user._id);
            const upvoteIndex = comment.upvotes.indexOf(req.user._id);
            if (upvoteIndex !== -1) {
                comment.upvotes.splice(upvoteIndex, 1);
            }
        }
        else {
            comment.downvotes.splice(userIndex, 1);
        }
        comment.save()
        .then(comment => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(comment);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/by/:userId')
.get(authenticate.isLoggedIn, (req, res, next) => {
    Posts.find({author: req.params.userId})
    .then(posts => {
        let promises = [];
        for (let i = 0; i < posts.length; i++) {
            promises.push(Comments.find({postId: posts[i]._id}));
        }
        Promise.all(promises)
        .then(comments => {
            for (let i = 0; i < comments.length; i++) {
                posts[i].set('commentCount', comments[i].length, Number, {strict: false});
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(posts);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

module.exports = router;