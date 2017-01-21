'use strict';

const router = require('express').Router();
const auth = require('../services/auth');

router.use('/', require('./homeController'));
router.use('/login', require('./loginController'));
router.use('/account', require('./accountController'));

module.exports = router;