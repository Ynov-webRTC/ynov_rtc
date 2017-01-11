"use strict";

var userModel = require("../model/userModel");

var User = function () {
    console.log("User");
};

User.prototype.create = function (req, callback){

    var email = req.body.email;
    var password = req.body.password;
    var user = new userModel({"username": username,"password": password,"email":email});
    user.save();

    callback();
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