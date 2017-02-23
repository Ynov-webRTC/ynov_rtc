module.exports = {

    grantedAccess: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    },

    isConnected: function (req) {
        return req.isAuthenticated();
    }
};
