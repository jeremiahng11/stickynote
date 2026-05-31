const nodemailer = require('nodemailer');

// SMTP settings come from environment variables (set these in Coolify).
const setting = {
    SMTP_SERVICE: process.env.SMTP_SERVICE || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
    SMTP_SECURE: (process.env.SMTP_SECURE || 'true') === 'true',
    EMAIL_FROM: process.env.EMAIL_FROM || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    EMAIL_TEXT: process.env.EMAIL_TEXT || 'Password for Sticky Notes',
    SUBJECT: process.env.EMAIL_SUBJECT || 'Password change request',
};

async function sendMail(email, newPassword) {
    const smtpTransport = nodemailer.createTransport({
        service: setting.SMTP_SERVICE || undefined,
        host: setting.SMTP_HOST,
        port: setting.SMTP_PORT,
        secure: setting.SMTP_SECURE,
        auth: {
            user: setting.EMAIL_FROM,
            pass: setting.EMAIL_PASS,
        },
    });

    let htmlbody = '<p>Hello</p>';
    htmlbody += '<p>' + setting.EMAIL_TEXT + '</p>';
    htmlbody += '<p>Change password is : <b>' + newPassword + '</b></p>';

    const mailOptions = {
        from: setting.EMAIL_FROM,
        to: email,
        subject: setting.SUBJECT,
        text: '',
        html: htmlbody,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    smtpTransport.close();
    return info;
}

module.exports = sendMail;
