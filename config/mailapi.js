const nodemailer = require('nodemailer');
const setting = require('./settings.json');

async function sendMail(email,newPassword)
{
      var smtpTransport = nodemailer.createTransport({
		service: setting.SMTP_SERVICE,
		host: setting.SMTP_HOST,
            port: setting.SMTP_PORT,
            secure: true,
		auth: {
			user: setting.EMAIL_FROM,
			pass: setting.EMAIL_PASS
		}
	});
    
      var htmlbody = '<p>Hello</p>';
      htmlbody += '<p>'+setting.EMAIL_TEXT+'</p>';
      htmlbody += '<p>Change password is : <b>'+newPassword+'</b></p>';
      var mailOptions={
            from: setting.EMAIL_FROM,
            to : email,
            subject : setting.SUBJECT,
            text : '',
            html: htmlbody
      }
      

      let info = await smtpTransport.sendMail(mailOptions);
      smtpTransport.close();
      // console.log("Email Response: ",info)
      return info;
}

module.exports = sendMail;