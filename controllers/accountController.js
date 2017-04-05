'use strict';

const router = require('express').Router();
const auth = require('../services/auth');
const userService = require('../services/userService');
const upload = require('../services/upload');

router.get('/', auth.grantedAccess, function (req, res) {

    userService.getUserById(req.user._id).then(function(user){
        res.render('account', {
            user: user,
            isConnected: auth.isConnected(req),
            messages: req.flash('success'),
            errors: req.flash('error'),
            scripts: ['/public/js/scriptAccount.js']
        });
    },function(error){
        req.flash('error', error);
        res.redirect('/');
    });
});

router.post('/update', auth.grantedAccess, function (req, res) {
    let user = req.user;
    user.name = req.body.name;
    user.lastname = req.body.lastname;
    user.bio = req.body.bio;
    userService.updateUser(user).then(function(){
        req.flash('success', 'Modification réussi!');
        res.redirect('/account');
    },function(error){
        req.flash('error', error);
        res.redirect('/account');
    });
});

router.post('/uploadavatar', auth.grantedAccess, function (req,res) {
    upload(req, res, function () {
        let idUser = req.user._id;
        if(req.file){
            let path = req.file.path;
            userService.upload(idUser,path).then(function(){
                req.flash('success', 'Modification réussi!');
                res.redirect('/account');
            },function (error) {
                req.flash('error', error);
                res.redirect('/account');
            });
        }else {
            req.flash('error', "Pas d'image selectioner!");
            res.redirect('/account');
        }
    });
});

router.get('/:name', auth.grantedAccess, function (req, res)  {
    let username = req.params.name;
    userService.getUserByUsername(username).then(function (user) {
        res.render('profil', {
            user: user,
            isConnected: auth.isConnected(req)
        })
    }, function (err) {
        req.flash('error', err);
        res.redirect('/index');
    })
})


module.exports = router;
