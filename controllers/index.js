'use strict';

const router = require('express').Router();
const auth = require('../services/auth');

router.use('/', require('./homeController'));
router.use('/login', require('./loginController'));

router.get('/logout', function(req, res, next) {
	req.logout();
	res.redirect('/');
});


module.exports = router;