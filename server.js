'use strict';

const url = require('url');
const express = require('express');
const minimist = require('minimist');
const ws = require('ws');
const fs = require('fs');
const https = require('https');
const mongoose = require("mongoose");
const exphbs = require('express-handlebars');
const app = express();

const argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://edwinnss.fr:8888/',
        ws_uri: 'wss://edwinnss.fr:8888/kurento'
    }
});

const options ={
  key:  fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
};

require('./config/authentification.js')(app);

mongoose.connect("mongodb://localhost/rtc", function (err) {
	if (err) {
		throw err;
	}
	const server = https.createServer(options, app).listen(8888, function() {
		console.log('init server');
		const wss = new ws.Server({
			server : server,
			path : '/kurento'
		});
		require('./kurento.js')(wss, argv);
	});
});

app.use('/public', express.static(__dirname + '/public'));
app.use('/', require('./controllers'));

app.engine('handlebars', exphbs({
	defaultLayout: 'main',
	helpers: require('handlebars-helpers')()
}));
app.set("view engine", "handlebars");

