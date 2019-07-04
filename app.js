const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config');
const userRouter = require('./routes/userRouter');

const app = express();

const port = process.env.PORT || 3000;

mongoose.connect(config.mongoUrl)

.then((db) => {
    console.log('Connected to MongoDB server');
})

.catch(err => next(err));

app.get('/', (req, res) => {
    res.send('Meme World');
});

app.use(passport.initialize());
app.use('/users', userRouter);

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
    console.log(`Server listening on port: ${port}`);
});

module.exports = app;