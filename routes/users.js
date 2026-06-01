const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();

//require models
const Users = require('../models/users');
const sendMail = require('../config/mailapi');

// Registration toggle: SIGNUP=1 (or unset) enables sign up, SIGNUP=0 disables it.
const signupEnabled = (process.env.SIGNUP || '1') !== '0';

// bcrypt work factor (10–12 recommended)
const SALT_ROUNDS = 12;
// how long a password-reset link stays valid
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

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
                        bcrypt.hash(password,SALT_ROUNDS, (err, hash)=>{
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

// Step 1: request a reset. Emails a one-time link to the account owner.
// Always responds generically so attackers can't probe which emails exist.
router.post('/forgot-password', async (req, res)=>{
      const generic = { status : true, message : 'If that email is registered, a reset link has been sent.' };
      try{
            const email = (req.body.email || '').trim();
            if(!email){ return res.json({status : false, message : 'Email is required.'}); }
            const user = await Users.findOne({where : {email : email}});
            if(user){
                  const token = crypto.randomBytes(32).toString('hex');
                  const expires = Date.now() + RESET_TTL_MS;
                  await Users.update({resetToken : token, resetExpires : expires}, {where : {id : user.id}});
                  const baseUrl = process.env.BASE_URL || (req.protocol + '://' + req.get('host'));
                  const link = baseUrl + '/reset-password?token=' + token;
                  try{ await sendMail(email, link); }
                  catch(mailErr){ console.log('Reset email failed:', mailErr.message); }
            }
            return res.json(generic);
      }catch(err){
            console.log('forgot-password error:', err.message);
            return res.json({status : false, message : 'Something went wrong, please try again.'});
      }
});

// Step 2: show the reset form if the token is valid.
router.get('/reset-password', async (req, res)=>{
      const token = req.query.token || '';
      let valid = false;
      try{
            const user = token ? await Users.findOne({where : {resetToken : token}}) : null;
            valid = !!(user && user.resetExpires && Number(user.resetExpires) > Date.now());
      }catch(err){ console.log('reset-password view error:', err.message); }
      res.render('reset-password', { token : token, valid : valid });
});

// Step 3: set the new password if the token is still valid, then invalidate it.
router.post('/reset-password', async (req, res)=>{
      try{
            const token = req.body.token || '';
            const password = req.body.password || '';
            if(password.length < 6){
                  return res.json({status : false, message : 'Password must be at least 6 characters.'});
            }
            const user = token ? await Users.findOne({where : {resetToken : token}}) : null;
            if(!user || !user.resetExpires || Number(user.resetExpires) < Date.now()){
                  return res.json({status : false, message : 'This reset link is invalid or has expired.'});
            }
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            await Users.update({password : hash, resetToken : null, resetExpires : null}, {where : {id : user.id}});
            return res.json({status : true, message : 'Password updated. You can now log in.'});
      }catch(err){
            console.log('reset-password error:', err.message);
            return res.json({status : false, message : 'Something went wrong, please try again.'});
      }
});

router.get('/logout', (req, res)=>{
      req.session.destroy()
      res.redirect('/');
});

module.exports = router