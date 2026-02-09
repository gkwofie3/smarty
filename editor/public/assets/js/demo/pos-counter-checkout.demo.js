/*

*/

var handleSelectTable = function() {
	"use strict";
	
	$(document).on('click', '[data-toggle="select-table"]', function(e) {
		e.preventDefault();
		
		var targetTable = $(this).closest('.pos-table');
		
		if ($(targetTable).hasClass('in-use')) {
			$('[data-toggle="select-table"]').not(this).closest('.pos-table').removeClass('selected');
			$(targetTable).toggleClass('selected');
			$('#pos').toggleClass('pos-sidebar-mobile-toggled');
		}
	});
};

$(document).ready(function() {
	handleSelectTable();
});