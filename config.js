module.exports = {
    secretKey: process.env.SECRET_KEY || '12345-67890-09876-54321',
    mongoUrl : process.env.MONGO_URL || 'mongodb://localhost:27017/memeWorld'
};