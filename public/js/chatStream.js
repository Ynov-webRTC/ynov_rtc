'use strict';

let socket = io();

wdtEmojiBundle.defaults.emojiSheets.apple = './public/bower_components/wdt-emoji-bundle/sheets/sheet_emojione_64_indexed_128.png';
wdtEmojiBundle.init('#message_cha');

$('#formChat').submit(function(){
	socket.emit('chat message', $('.chat_window #message_chat').val());
	$('.chat_window #message_chat').val('');
	return false;
});
socket.on('chat message', function(msg){
	$('.chat_window .chat_messages').append("<li>"+wdtEmojiBundle.render(msg)+"</li>");
});