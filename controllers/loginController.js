'use strict';

const router = require('express').Router();
const passport = require('passport');

router.post('/',
	passport.authenticate('local', {
			successRedirect: '/',
			failureRedirect: '/',
			failureFlash: 'Impossible de vous connecter',
			successFlash: 'Connexion réussi'
		}
	)
);

module.exports = router;