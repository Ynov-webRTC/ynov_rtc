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
    let user = {
        username: req.body.prenom,
        email: req.body.nom,
        password: req.body.bio
    };

    res.render('update', {
        user: req.user,
        isConnected: auth.isConnected(req),
        messages: req.flash('success'),
        errors: req.flash('error')
    });
});


module.exports = router;
