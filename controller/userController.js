"use strict";

var userModel = require("../model/User");



var User = function () {
    console.log("User");
};

User.prototype.create = function (req, callback){
    var username = req.username;
    var email = req.email;
    var password = req.password;
    var user = new userModel({"username": username,"password": password,"email": email});
    user.save();

    callback(user);
};




User.prototype.remove = function (callback) {
    console.log(session.user);
    userModel.remove(session.user, function (err) {
        if (err) {
            throw err;
        }
        callback();
    });
};

module.exports = User;