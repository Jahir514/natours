const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');


module.exports = class Email {
    constructor(user, url) {
        this.to = user.email,
        this.firstName = user.name.split(' ')[0],
        this.url = url,
        this.from = `Jahir Hasan <${process.env.EMAIL_FROM}>`
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // send email

            return 1;
        }

        return  nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // to work without ssl security or ignore ssl security
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send(template, subject) {
        // 1) render html from pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) email options
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };

        // 3) send email
        await this.newTransport().sendMail(emailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to my website');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Reset your password (exist only for 10 min)');
    }
};






