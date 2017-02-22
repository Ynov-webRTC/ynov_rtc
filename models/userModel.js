'use strict';

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String
    },
    name: {
        type: String
    },
    lastname: {
        type: String
    },
    bio: {
        type: String
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    date_created: {
        type: Date,
        default: Date.now()
    }
});
const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
