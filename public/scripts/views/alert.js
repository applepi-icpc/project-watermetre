var app = app || {};

var flashInterval = 200;

app.alert = function pageAlert (str, noFlash) {
	$('#alert').text(str).show();
	if (!noFlash) {
		$('#alert').addClass('flash');
		_.delay(function () {
			$('#alert').removeClass('flash');
		}, flashInterval);
		_.delay(function () {
			$('#alert').addClass('flash');
		}, flashInterval * 2);
		_.delay(function () {
			$('#alert').removeClass('flash');
		}, flashInterval * 3);
	}
};

app.hideAlert = function hideAlert (duration) {
	if (duration) $('#alert').hide(duration);
	else $('#alert').hide();
};

$('#alert').click(function () {
	$('#alert').hide();
});