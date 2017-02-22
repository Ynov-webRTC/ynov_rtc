'use strict';

$(document).ready(function () {
	$('.alert').fadeTo(2000, 500).slideUp(500);

	let socket = io();

	$('#formChat').submit(function () {
		socket.emit('chat message', $('.chat_window #message_chat').val());
		$('.chat_window #message_chat').val('');
		return false;
	});
	socket.on('chat message', function (msg) {
		$('.chat_window .chat_messages').append('<li>' + emojione.shortnameToImage(msg) + '</li>');
	});

	/* $('#share_screen').on('click', function() {
		getScreenId(function (error, sourceId, screen_constraints) {
			if (error === 'not-installed') {
				return swal({
					title: 'Erreur!',
					html: "<html>Le partage d'écran ne fonctionne pas sans le plugin que vous pouvez téléchargez " +
					"<a href='https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk'>" +
					"ici</a>!</html>",
					type: 'error'
				});
			}
			navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
			navigator.getUserMedia(screen_constraints, function (stream) {
				navigator.getUserMedia({audio: true}, function (audioStream) {
					stream.addTrack(audioStream.getAudioTracks()[0]);
					let mediaRecorder = new MediaStreamRecorder(stream);
					mediaRecorder.mimeType = 'video/mp4';
					mediaRecorder.stream = stream;
					$('.video_share_screen').attr('src', URL.createObjectURL(stream));
				}, function(error) {
					console.log(error);
				});
			}, function (error) {
				console.error(error);
			});
		});
	}); */
});

