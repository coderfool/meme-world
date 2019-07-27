const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const crypto = require('crypto');
const config = require('./config');

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

module.exports.resetAndEmail = (user) => {
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