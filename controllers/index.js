'use strict';

const router = require('express').Router();
const auth = require('../services/auth');
const userService = require('../services/userService');

router.use('/', require('./homeController'));
router.use('/login', require('./loginController'));
router.use('/account', require('./accountController'));
router.use('/api', require('../kurento').router);

router.get('/:name', function (req, res)  {
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
