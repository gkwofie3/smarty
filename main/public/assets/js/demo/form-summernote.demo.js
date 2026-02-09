/*

*/

var handleSummernote = function() {
	$(".summernote").summernote({
		placeholder: "Hi, this is summernote. Please, write text here! Super simple WYSIWYG editor on Bootstrap",
		height: $(window).height() * 0.5
	});
};

var FormSummernote = function () {
	"use strict";
	return {
		//main function
		init: function () {
			handleSummernote();
		}
	};
}();

$(document).ready(function() {
	FormSummernote.init();
});