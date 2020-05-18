const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AuthUser = require('../models/auth_user');



router.get('/',(req,res,next)=> {

    AuthUser.find()
    .select('name email dob gender') //this columns were fetched we can also remove this select options for showing all columns
    .exec()
    .then(docs =>{
       const response = {
            count : docs.length,
            users : docs.map(doc =>{
                return{
                    name : doc.name,
                    email : doc.email,
                    dob : doc.dob,
                    _id : doc._id,
                    gender : doc.gender,

                }
            })
       };
       res.status(200).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
           error : err
        });
    });
   

});


router.post('/signup',(req,res,next) =>{

    AuthUser.find({
        email: req.body.email
    }).exec()
    .then(authuser => {
        if(authuser.length >= 1){
            return res.status(409).json({
                message : 'mail exists'
            });
        }
        else{

            bcrypt.hash(req.body.password,10,(err,hash) =>{
                if(err){
                    return res.status(500).json({
                        error: err
                    });
                }else{
                    const authuser = new AuthUser({
                        _id : new mongoose.Types.ObjectId(),
                        email : req.body.email,
                        password : hash,
                        name : req.body.name,
                        dob : req.body.dob,
                        gender : req.body.gender
                });
    
                authuser.save()
                .then(result =>{
                    console.log(result)
                    res.status(201).json({
                        message : 'User Created'
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        error : err
                    });
                });
        
           }
        });
    

        }
    })
    
    
});


router.post('/login',(req,res,next)=>{
    AuthUser.find({email: req.body.email})
    .exec()
    .then(authuser => {
        if(authuser.length<1){
            return res.status(401).json({
                message:'Mail not found'
            });
        }
        bcrypt.compare(req.body.password,authuser[0].password,(err,result) =>{
             if(err){
                return res.status(401).json({
                    message:'Auth failed'
                });
             }
             if(result){
                const token =  jwt.sign({
                     email:authuser[0].email,
                     authuserId: authuser[0]._id
                 },process.env.JWT_KEY,
                 {
                     expiresIn:"1h"
                 })
                return res.status(200).json({
                    message:'Auth successful',
                    token:token,
                    user: authuser
                });
             }
             return res.status(401).json({
                message:'Auth failed'
            });
        });
    })
    .catch(err =>{
        console.log(err);
        res.status(500).json({
            error : err
        });
    });
});

router.delete('/:authUserId',(req,res,next)=>{
      AuthUser.remove({ _id: req.params.authUserId })
      .exec()
      .then(result => {
          res.status(200).json({
              message : 'User Deleted'
          });

      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
            error : err
        });
    });
});

module.exports = router;