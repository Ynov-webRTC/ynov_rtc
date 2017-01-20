'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/userModel');
const bodyParser = require("body-parser");
const flash = require('connect-flash');
const session = require('express-session');

module.exports = function (app) {

	app.use(bodyParser.urlencoded({extended: false}));
	app.use(flash());
	app.use(session({
		secret: 'ynovrtcnacim',
		resave: true,
		saveUninitialized: true
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	passport.use(new LocalStrategy(
		function(username, password, done) {
			User.findOne({ username: username }, function(err, user) {
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Nom invalide.' });
				}
				if (user.password !== password) {
					return done(null, false, { message: 'Mot de passe invalide.' });
				}
				return done(null, user);
			});
		}
	));

	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(user, done) {
		done(null, user);
	});

};