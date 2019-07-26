const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const Users = require('../models/user');
const Posts = require('../models/post');
const Comments = require('../models/comment');
const authenticate = require('../authenticate');
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

router.route('/')
.get((req, res, next) => {
    Posts.find()
    .then(posts => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(posts);
    })
    .catch(err => next(err));
})

.post(authenticate.isLoggedIn, upload.single('image'), (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const payload = authenticate.getPayload(token);
    Posts.create({
        title: req.body.title,
        image: req.file.buffer,
        author: payload._id
    })
    .then(post => {
        res.redirect(`/posts/${post._id}`);
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

.put((req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const payload = authenticate.getPayload(token);
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        if (payload._id !== post.author) {
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

.delete((req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const payload = authenticate.getPayload(token);
    Posts.findById(req.params.postId)
    .then(post => {
        if (payload._id !== post.author) {
            const err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        Posts.findByIdAndDelete(req.params.postId)
        .then(resp => {
            res.status(200).end();
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
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const payload = authenticate.getPayload(token);
    Posts.findById(req.params.postId)
    .then(post => {
        if (!post) {
            const err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        const comment = {
            postId: post._id,
            text: req.body.text,
            author: payload._id
        };
        if (req.file) {
            comment.image = req.file.buffer;
        }
        Comments.create(comment)
        .then(comment => {
            res.status(200).end();
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.route('/comments/:commentId')
.put(authenticate.isLoggedIn, (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const payload = authenticate.getPayload(token);
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        if (payload._id !== comment.author) {
            const err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
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
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const payload = authenticate.getPayload(token);
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        if (payload._id !== comment.author) {
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

module.exports = router;