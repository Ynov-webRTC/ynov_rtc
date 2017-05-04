'use strict';

$(document).ready(function () {

    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    $('.alert').fadeTo(2000, 500).slideUp(500);

    let socket = io();

    $('#formChat').submit(function () {
        let myObject = {
            message: $('#message_chat').val(),
            user: $('#inputUsername').val()
        }
        myObject.message = escapeHtml(myObject.message.trim());
        socket.emit('other_message', JSON.stringify(myObject));
        socket.emit('own_message', JSON.stringify(myObject));
        $('#message_chat').val('');
        return false;
    });

    socket.on('own_message', function (myObject) {
        myObject = JSON.parse(myObject);
        let date = new Date();
        let currentDate = date.getHours()+":"+date.getMinutes()
        $('.chat_messages').append(''
			+ '<li>'
            + '<small class="pull-right text-muted" style="color:black;"><span>At </span>' + currentDate + '</small><br/>'
			+ '<div class="chat-body clearfix from-me">'
			+ '<div class="header">'
            + '</div>'
			+ '<div class="body">'
            + '<span style="color:white;">' + emojione.shortnameToImage(myObject.message) + '</span>'
			+ '</div>'
			+ '</div>'
			+ '</li>');
    });

    socket.on('other_message', function (myObject) {
        myObject = JSON.parse(myObject);
        let date = new Date();
        let currentDate = date.getHours()+":"+date.getMinutes()
        $('.chat_messages').append(''
            + '<li>'
            + '<span class="primary-font user_from-them">' + myObject.user +'</span><small class="pull-right text-muted" style="color: black;"><span>At </span>' + currentDate + '</small>'
            + '<div class="chat-body clearfix from-them">'
            + '<div class="header">'
            + '</div>'
            + '<div class="body">'
            + '<span style="color:black;">' + emojione.shortnameToImage(myObject.message) + '</span>'
            + '</div>'
            + '</div>'
            + '</li>');
    })
});

