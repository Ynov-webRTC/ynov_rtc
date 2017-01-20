"use strict";

const userService = require('../services/userService');

let User = class {

    create(req, callback) {
        let user = {
	        username : req.username,
	        email : req.email,
	        password : req.password
        };
        userService.createUser(user, function(){

        });
	    callback(user);
    }

};

module.exports = User;