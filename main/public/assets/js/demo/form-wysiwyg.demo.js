/*

*/

var handleBootstrapWysihtml5 = function () {
	"use strict";
	$('#wysihtml5').wysihtml5();
};

var handleQuill = function() {
	const quill = new Quill('#editor1', {
    theme: 'snow',
    placeholder: 'Type something...'
  });
};

$(document).ready(function() {
	handleQuill();
	handleBootstrapWysihtml5();
	
	$(document).on('theme-reload', function() {
		$('.wysihtml5-sandbox, input[name="_wysihtml5_mode"], .wysihtml5-toolbar').remove();
		$('#wysihtml5').show();
		handleBootstrapWysihtml5();
	});
});