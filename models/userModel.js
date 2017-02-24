'use strict';

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String
    },
    name: {
        type: String,
        default: ""
    },
    lastname: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: "",
    },
    avatar: {
        type: String,
        default: ""
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
