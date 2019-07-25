const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const Users = require('../models/user');
const Posts = require('../models/post');
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
    .then(posts => {
        res.status(200).end();
    })
    .catch(err => next(err));
})