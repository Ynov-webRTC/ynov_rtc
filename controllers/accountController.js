'use strict';

const router = require('express').Router();
const fs = require('fs');
const auth = require('../services/auth');

router.get('/', function(req, res) {
	res.render('account', {
		isConnected: auth.isConnected(req),
		messages: req.flash("success"),
		errors: req.flash("error")
	})
});

module.exports = router;