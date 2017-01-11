module.exports = function (app) {

    app.get('/', function (req, res) {
        res.render('index');
    });

    app.get('/test', function (req, res) {
        res.end("salut mon pote");
    });

    app.post('/login',
        passport.authenticate('local', { successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true })
    );
}
