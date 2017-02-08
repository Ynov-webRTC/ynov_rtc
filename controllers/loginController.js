'use strict';

const router = require('express').Router();
const passport = require('passport');
const userService = require('../services/userService');
const auth = require('../services/auth');

router.post('/',
    passport.authenticate('local', {
            successRedirect: '/stream',
            failureRedirect: '/',
            failureFlash: 'Impossible de vous connecter',
            successFlash: 'Connexion réussi'
        }
    )
);

router.get('/signup', function(req, res) {
    res.render('signup', {
        scripts: [
            '/public/bower_components/bootstrap-validator/dist/validator.min.js',
            '/public/js/scriptLogin.js'
        ],
        isConnected: auth.isConnected(req),
        messages: req.flash("success"),
        errors: req.flash("error")
    });
});

router.post('/signup', function(req, res) {
    let user = {
        username : req.body.username,
        email : req.body.email,
        password : req.body.password
    };
    userService.createUser(user, function(error, user){
        if(error) {
            req.flash('error', 'Impossible de créer cet utilisateur!');
            res.redirect('/signup');
        }
        req.login(user, function() {
            req.flash('success', 'Inscription réussi!');
            res.redirect('/account');
        });
    });
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;