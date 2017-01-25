'use strict';

const router = require('express').Router();
const fs = require('fs');
const auth = require('../services/auth');

router.get(['/', '/index'], function(req, res) {
	res.render('index', {
		isConnected: auth.isConnected(req),
		messages: req.flash("success"),
		errors: req.flash("error")
	});
});

router.get('/stream', function(req, res) {
	res.render('stream', {
		isConnected: auth.isConnected(req),
		messages: req.flash("success"),
		errors: req.flash("error")
	});
});

module.exports = router;
