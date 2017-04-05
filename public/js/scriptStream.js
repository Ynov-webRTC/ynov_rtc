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
        myObject.message = escapeHtml(myObject.message);
        socket.emit('other_message', JSON.stringify(myObject));
        socket.emit('own_message', JSON.stringify(myObject));
        $('#message_chat').val('');
        return false;
    });

    socket.on('own_message', function (myObject) {
        myObject = JSON.parse(myObject);
        let date = new Date();
        let currentDate = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
        $('.chat_messages').append(''
			+ '<li>'
			+ '<div class="chat-body clearfix from-me">'
			+ '<div class="header">'
            + '<span class="primary-font" style="color: black">' + myObject.user +'</span>'
            + '<small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span>' + currentDate + '</small>'
            + '</div>'
			+ '<div class="body">'
            + emojione.shortnameToImage(myObject.message)
			+ '</div>'
			+ '</div>'
			+ '</li>');
    });

    socket.on('other_message', function (myObject) {
        myObject = JSON.parse(myObject);
        let date = new Date();
        let currentDate = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
        $('.chat_messages').append(''
            + '<li>'
            + '<div class="chat-body clearfix from-them">'
            + '<div class="header">'
            + '<span class="primary-font" style="color: black">' + myObject.user +'</span>'
            + '<small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span>' + currentDate + '</small>'
            + '</div>'
            + '<div class="body">'
            + emojione.shortnameToImage(myObject.message)
            + '</div>'
            + '</div>'
            + '</li>');
    })
});

