'use strict';

$(document).ready(function() {

	$('#edit').on('click', function () {
		$('.inputUpdate').each(function () {
			$(this).attr('disabled', false);
		});
	});
});
