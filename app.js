const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');
const userRouter = require('./routes/userRouter');
const postRouter = require('./routes/postRouter');

const app = express();

global.appRoot = __dirname;

const port = process.env.PORT || 3000;

mongoose.connect(config.mongoUrl, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
})
.then((db) => {
    console.log('Connected to MongoDB server');
})
.catch(err => console.error(err));

app.use(express.static(path.join(appRoot, 'public')));
app.use(passport.initialize());
app.use('/users', userRouter);
app.use('/posts', postRouter);

// redirect to home if route doesn't exist
app.use((req, res, next) => {
    res.redirect('/');
});

// error handler
app.use((err, req, res, next) => {
    const error = {
        status: err.status || 500,
        message: err.message
    };

    res.statusCode = error.status;
    res.json({
        error: error
    }); 
});

app.listen(port, () => {
    console.error(`Server listening on port: ${port}`);
});

module.exports = app;