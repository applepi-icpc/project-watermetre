var app = app || {};

var animationDuration = 300;
var flashInterval = 1000;

app.alert = function pageAlert (str) {
	$('#alert').text(str).fadeIn(animationDuration).addClass('flash');
	_.delay(function () {
		$('#alert').removeClass('flash');
	}, flashInterval);
};

$('#alert').click(function () {
	$('#alert').fadeOut(animationDuration);
});