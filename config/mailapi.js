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

async function sendMail(email, resetLink) {
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

    let htmlbody = '<p>Hello,</p>';
    htmlbody += '<p>We received a request to reset your Sticky Notes password.</p>';
    htmlbody += '<p><a href="' + resetLink + '">Click here to choose a new password</a>. This link expires in 1 hour.</p>';
    htmlbody += '<p>If you did not request this, you can safely ignore this email.</p>';

    const mailOptions = {
        from: setting.EMAIL_FROM,
        to: email,
        subject: setting.SUBJECT,
        text: 'Reset your Sticky Notes password: ' + resetLink + ' (expires in 1 hour)',
        html: htmlbody,
    };

    const info = await smtpTransport.sendMail(mailOptions);
    smtpTransport.close();
    return info;
}

module.exports = sendMail;
