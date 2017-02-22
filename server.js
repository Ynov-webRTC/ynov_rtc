'use strict';

const url = require('url');
const express = require('express');
const minimist = require('minimist');
const ws = require('ws');
const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const io = require('socket.io')(https);

const app = express();

const argv = minimist(process.argv.slice(2), {
	default: {
		as_uri: 'https://edwinnss.fr:8443/',
		ws_uri: 'ws://edwinnss.fr:8888/kurento'
	}
});

const options = {
	key: fs.readFileSync('keys/server.key'),
	cert: fs.readFileSync('keys/server.crt')
};

require('./config/authentification.js')(app);

mongoose.connect('mongodb://localhost/rtc', function (err) {
	if (err) {
		throw err;
	}
	const server = https.createServer(options, app).listen(8443, function () {
		console.log('init server');
		const wss = new ws.Server({
			server: server,
			path: '/kurento'
		});
		require('./kurento.js')(wss, argv);
		io.listen(server);
	});
});

io.on('connection', function (socket) {
	socket.on('chat message', function (msg) {
		if (msg.length > 0) {
			io.emit('chat message', msg);
		}
	});
});

app.use('/public', express.static(__dirname + '/public'));
app.use('/', require('./controllers'));

app.engine('handlebars', exphbs({
	defaultLayout: 'main',
	helpers: require('handlebars-helpers')()
}));
app.set('view engine', 'handlebars');

/*
let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'gmail.user@gmail.com',
		pass: 'yourpass'
	}
});

// setup email data with unicode symbols
let mailOptions = {
	from: '"Fred Foo 👻" <foo@blurdybloop.com>', // sender address
	to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
	subject: 'Hello ✔', // Subject line
	text: 'Hello world ?', // plain text body
	html: '<b>Hello world ?</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, (error, info) => {
	if (error) {
		return console.log(error);
	}
	console.log('Message %s sent: %s', info.messageId, info.response);
});
*/
