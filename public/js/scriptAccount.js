'use strict';

$(document).ready(function() {
    $('.alert').fadeTo(2000, 500).slideUp(500);

    $('#edit').on('click', function () {
        $('.inputUpdate').each(function () {
            $(this).attr('disabled', false);
        });
    });



});
