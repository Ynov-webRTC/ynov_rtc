const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const q = require('q');

module.exports = {

	createUser(data) {
		let deferred = q.defer();
		User.find({username: data.username}).exec()
			.then(function (users) {
				if (users.length === 0) {
					bcrypt.hash(data.password, 10, function (err, hash) {
						data.password = hash;
						User.create(data, function (err, user) {
							if (err) {
								deferred.reject('Impossible de créer cet utilisateur!');
							} else {
								deferred.resolve(user);
							}
						});
					});
				} else {
					deferred.reject('Cet utilisateur existe déjà!');
				}
			}
		);
		return deferred.promise;
	}

};
