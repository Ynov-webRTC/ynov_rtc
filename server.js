var path = require('path');
var url = require('url');
var express = require('express');
var minimist = require('minimist');
var ws = require('ws');
var fs    = require('fs');
var https = require('https');
var mongoose = require("mongoose");
var passport = require('passport');
var bodyParser = require("body-parser");
var flash = require('connect-flash');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');


mongoose.connect("mongodb://localhost/rtc", function (err) {
	if (err) {
		throw err;
	}
});

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


app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(flash());
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set("views", './views');
app.set('view engine', 'hbs');

require('./routes.js')(app);
var User = require('./model/User');
passport.use(new LocalStrategy(
	function(username, password, done) {
		User.findOne({ username: username }, function(err, user) {
			if (err) { return done(err); }
			if (!user) {
				return done(null, false, { message: 'Incorrect username.' });
			}
			if (user.password !== password) {
				return done(null, false, { message: 'Incorrect password.' });
			}
			return done(null, user);
		});
	}
));
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});