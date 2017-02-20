'use strict';

$(document).ready(function() {

	$(".alert").fadeTo(2000, 500).slideUp(500);

	let socket = io();

	$('#formChat').submit(function(){
		socket.emit('chat message', $('.chat_window #message_chat').val());
		$('.chat_window #message_chat').val('');
		return false;
	});
	socket.on('chat message', function(msg){
		$('.chat_window .chat_messages').append("<li>"+emojione.shortnameToImage(msg)+"</li>");
	});

});

