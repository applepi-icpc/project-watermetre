var app = app || {};

var animationDuration = 500; // milliseconds

app.loginEffect = function () {
	$('h1').animate({ left: '10px' }, animationDuration, 'linear');
	$('#magnolia').fadeIn(animationDuration);
	$('#dashboard').fadeIn(animationDuration, function() {
		$('.nano').nanoScroller();
	});
	$('#tasks').fadeIn(animationDuration, function() {
		$('.nano').nanoScroller();
	});
	$('#login').fadeOut(animationDuration);
};
app.logoutEffect = function () {
	$('h1').animate({ left: '363px' }, animationDuration, 'linear');
	$('#magnolia').fadeOut(animationDuration);
	$('#dashboard').fadeOut(animationDuration, function() {
		$('.nano').nanoScroller();
	});
	$('#newtask').fadeOut(animationDuration, function() {
		$('.nano').nanoScroller();
	});
	$('#tasks').fadeOut(animationDuration, function() {
		$('.nano').nanoScroller();
	});
	$('#login').fadeIn(animationDuration);
};