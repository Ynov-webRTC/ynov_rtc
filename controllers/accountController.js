'use strict';

const router = require('express').Router();
const auth = require('../services/auth');
const userService = require('../services/userService');

router.get('/', function (req, res) {
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
    user.name = req.body.prenom;
    user.lastname = req.body.nom;
    user.bio = req.body.bio;
    userService.updateUser(user).then(function(user){
        req.flash('success', 'Modification réussi!');
        res.render('account', {
            user: req.user,
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


module.exports = router;
