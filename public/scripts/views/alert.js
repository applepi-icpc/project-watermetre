var app = app || {};

var flashInterval = 200;

app.alert = function pageAlert (str, noFlash) {
	$('#alert').text(str)
	$('#alertWrap').show();
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
	if (duration) $('#alertWrap').hide(duration);
	else $('#alertWrap').hide();
};

$('#alert').click(function () {
	$('#alertWrap').hide(500);
});