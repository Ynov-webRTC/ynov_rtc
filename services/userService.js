const User = require('../models/userModel');

module.exports = {

	createUser(data, callback) {
		User.create(data, function(err, user) {
			if(err) {
				callback(err, null);
			}else {
				callback(null, user);
			}
		});
	},

};