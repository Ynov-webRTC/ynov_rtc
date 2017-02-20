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

router.get('/stream', auth.grantedAccess, function(req, res) {
	res.render('stream', {
		scripts: [
			'/public/bower_components/adapter.js/adapter.js',
			'/public/bower_components/kurento-utils/js/kurento-utils.js',
			'/public/js/kurentoClient.js',
			'/public/bower_components/emojione/lib/js/emojione.js',
			'/public/bower_components/wdt-emoji-bundle/wdt-emoji-bundle.min.js',
			'/socket.io/socket.io.js',
			'/public/js/chatStream.js'
		],
		isConnected: auth.isConnected(req),
		messages: req.flash("success"),
		errors: req.flash("error")
	});
});

module.exports = router;
