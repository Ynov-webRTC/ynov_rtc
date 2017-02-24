'use strict';

const router = require('express').Router();
const auth = require('../services/auth');
const userService = require('../services/userService');

router.get('/', auth.grantedAccess, function (req, res) {
    res.render('account', {
        user: req.user,
        isConnected: auth.isConnected(req),
        messages: req.flash('success'),
        errors: req.flash('error'),
        scripts: ['/public/js/scriptAccount.js']
    });
});

router.post('/update', auth.grantedAccess, function (req, res) {
    let user = req.user;
    user.name = req.body.name;
    user.lastname = req.body.lastname;
    user.bio = req.body.bio;
    userService.updateUser(user).then(function(user){
        req.flash('success', 'Modification réussi!');
        res.render('account', {
            user: user,
            isConnected: auth.isConnected(req),
            messages: req.flash('success'),
            errors: req.flash('error'),
            scripts: ['/public/js/scriptAccount.js']
        })
    },function(error){
        req.flash('error', error);
        res.redirect('/login/signup');
    })
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
