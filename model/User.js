"use strict";
var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    username: {
        type: String
    },
    password:{
        type:String
    },
    email:{
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }
});
var userModel = mongoose.model("user", userSchema);

module.exports = userModel;