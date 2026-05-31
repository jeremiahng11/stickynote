const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

//require models
const Users = require('../models/users');
const sendMail = require('../config/mailapi');

// Registration toggle: SIGNUP=1 (or unset) enables sign up, SIGNUP=0 disables it.
const signupEnabled = (process.env.SIGNUP || '1') !== '0';

//errorHandler Function
const errorHandler = (err, res) =>{
      console.log("Error :"+err)
      return res.json({ status : 'error', Error  : err })
}

router.get('/',(req, res)=>{
      res.render('login-register', { signupEnabled });
});

router.post('/login-register',(req, res)=>{ 
      var email = req.body.email
      var password = req.body.password
      var cpass = req.body.cpass
      
      if(email && password && cpass){
            //block registration when sign up is disabled
            if(!signupEnabled){
                  return res.json({status : false, message:'Registration is currently disabled.'})
            }
            //find email address is exist or not
            Users.findOne({where : {email : email}}).then((result)=>{
                  if(result){
                        res.json({status : false, message:'User already exists...Try another Email address!!'}) 
                  }else{
                        //bcrypt used for encrypt password 
                        bcrypt.hash(password,8, (err, hash)=>{
                              //create users
                              Users.create({
                                    email: email,
                                    password: hash
                              }).then((joinUser)=>{
                                    res.json({status: true, message : 'User registered!!'})
                              }).catch(errorHandler);
                        });
                  }
            }).catch(errorHandler);
      }else{
            //find email address is exist or not
            Users.findOne({where : {email : email}}).then((result)=>{ 
                  if(result){
                        bcrypt.compare(password, result.password, (err, result1)=>{
                              if(result1 == true){
                                    req.session.Id = result.id
                                    res.json({status : true, message:'Login successfully!!'})
                              }else{
                                    res.json({status : false, message:'Invalid Details Please Fill Correct Info.'})
                              }
                        });
                  }else{
                        res.json({message:'Email not exists, Please Fill Correct Info.'})
                  }
            }).catch(errorHandler); 
      }    
});

router.get('/forgot-password',(req, res)=>{
      res.render('forgot-password')
});

router.post('/forgot-password',(req, res)=>{ 
      var email =  req.body.email
      var newPassword = req.body.newPassword
      Users.findOne({where :{email : email}}).then((result)=>{
            if(result){
                  bcrypt.hash(newPassword, 8, async(err, hash)=>{
                        let m =  await sendMail(email,newPassword);
                        if(m.messageId){
                              Users.update({password:hash},{where:{email: result.email}}).then((updateData)=>{
                                    res.json({status : true, message : 'Please check your mail inbox!'})
                              }).catch((err)=>{
                                    res.json({status : false, message:'Password not updated', error : err})
                              });
                        }else{
                              res.json({status : false, message : 'We are not able to send email now, please try after sometime!'})
                        }

                  });
            }else{
                  res.json({status : false, message:'Email not exists!!'})
            }
      }).catch((err)=>{
            res.json({status : false, message:'Email not exists!!', error : err})
      });
});

router.get('/logout', (req, res)=>{
      req.session.destroy()
      res.redirect('/');
});

module.exports = router