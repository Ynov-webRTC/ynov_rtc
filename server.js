var path = require('path');
var url = require('url');
var express = require('express');
var minimist = require('minimist');
var ws = require('ws');
var fs    = require('fs');
var https = require('https');
var passport = require('passport-local');

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://edwinnss.fr:8888/',
        ws_uri: 'wss://edwinnss.fr:8888/kurento'
    }
});

var options ={
  key:  fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
};

var app = express();

/*
 * Server startup
 */
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function() {
    console.log('init server');
});

var wss = new ws.Server({
    server : server,
    path : '/kurento'
});


require('./kurento.js')(wss, argv);

function connexionUser() {
	var passport = require('passport')
		, LocalStrategy = require('passport-local').Strategy;

	passport.use(new LocalStrategy(
		function(username, password, done) {
			User.findOne({ username: username }, function(err, user) {
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Incorrect username.' });
				}
				if (!user.validPassword(password)) {
					return done(null, false, { message: 'Incorrect password.' });
				}
				return done(null, user);
			});
		}
	));
}
app.use(express.static(path.join(__dirname, 'static')));

app.set("views", './views');
app.set('view engine', 'hbs');

require('./routes.js')(app);