/*

*/

var getRandomValue = function() {
	var value = [];
	for (var i = 0; i<= 28; i++) {
		value.push(Math.floor((Math.random() * 10) + 1));
	}
	return value;
};

var handleRenderKnobDonutChart = function() {
	$('.knob').knob();
};

var handleRenderSparkline = function() {
	var options = {
		height: '30px',
		width: '100%',
		fillColor: 'transparent',
		type: 'bar',
		barWidth: 5,
		barColor: app.color.success
	};
    
	var value = getRandomValue();
	$('#sidebar-sparkline-1').sparkline(value, options);

	value = getRandomValue();
	options.barColor = app.color.blue;
	$('#sidebar-sparkline-2').sparkline(value, options);

	value = getRandomValue();
	options.barColor = app.color.purple;
	$('#sidebar-sparkline-3').sparkline(value, options);

	value = getRandomValue();
	options.barColor = app.color.red;
	$('#sidebar-sparkline-4').sparkline(value, options);
};

var PageWithTwoSidebar = function () {
	"use strict";
	return {
		//main function
		init: function () {
			handleRenderKnobDonutChart();
			handleRenderSparkline();
		}
	};
}();

$(document).ready(function() {
	PageWithTwoSidebar.init();
});