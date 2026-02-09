/*

*/

var handleDataTableColReorder = function() {
	"use strict";
    
	if ($('#data-table-colreorder').length !== 0) {
		$('#data-table-colreorder').DataTable({
			colReorder: true,
			responsive: true
		});
	}
};

var TableManageColReorder = function () {
	"use strict";
	return {
		//main function
		init: function () {
			handleDataTableColReorder();
		}
	};
}();

$(document).ready(function() {
	TableManageColReorder.init();
});