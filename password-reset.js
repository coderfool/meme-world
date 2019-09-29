const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const crypto = require('crypto');
const config = require('./config');
const Users = require('./models/user');

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
        user: config.nodemailerEmail,
        pass: config.nodemailerPassword
    }
});

transporter.use('compile', hbs({
    viewEngine: {
        partialsDir: 'views/partials/',
        layoutsDir: 'views/layouts/',
        defaultLayout : 'main'
    },
    viewPath: 'views/' 
}));

const getRandomPassword = (len) => {
    const buffer = crypto.randomBytes(len);
    return buffer.toString('hex');
};

module.exports.generateResetToken = (len) => {
    const buffer = crypto.randomBytes(len);
    return buffer.toString('hex');
};

module.exports.validateToken = (token) => {
    if (!token) {
        return Promise.reject('Invalid token');
    }

    return Users.findOne({resetToken: token, tokenExp: { $gt: Date.now() }})
    .then(user => {
        if (!user) {
            const err = new Error('Invalid token');
            err.status = 422;
            return Promise.reject(err);
        }
        return Promise.resolve(user);
    })
    .catch(err => {
        return Promise.reject(err);
    });
};

module.exports.sendResetEmail = function(user, resetToken) {
    const mail = {
        from: `Meme World <${config.nodemailerEmail}>`,
        to: user.email, 
        subject: "Reset Password",
        template: 'reset-password-email',
        context: {
            username: user.username,
            resetToken: resetToken
        }
    };
    return transporter.sendMail(mail);
};

module.exports.resetAndEmail = (user) => {
    if (!user) {
        const err = {
            status: 404,
            message: 'User not found'
        };
        return Promise.reject(err);
    }
    const newPassword = getRandomPassword(3);
    return user.setPassword(newPassword)  
    .then(user => {
        return user.save()
        .then(user => {
            const mail = {
                from: `Meme World <${config.nodemailerEmail}>`,
                to: user.email, 
                subject: "Password Reset",
                template: 'password-reset',
                context: {
                    username: user.username,
                    newPassword: newPassword
                }
            };
            return transporter.sendMail(mail);
        })
        .catch(err => {
            return Promise.reject(err);
        });
    })
    .catch(err => {
        return Promise.reject(err);
    });
};