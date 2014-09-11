var app = app || {};

var animationDuration = 500;

$(function () {
	$('#newCommand').hide();

	$('#cmdNewTask').click(function() {
		app.classes.reset();
		$('#taskCommand').fadeOut(animationDuration, function () {
			$('#newCommand').fadeIn(animationDuration, function () {
				$('.nano').nanoScroller();
			})
		});
		$('#tasks').fadeOut(animationDuration, function () {
			$('#newtask').fadeIn(animationDuration, function () {
				$('.nano').nanoScroller();
			});
		});
	});

	$('#cmdCancelNewTask').click(function() {
		$('#newCommand').fadeOut(animationDuration, function () {
			$('#taskCommand').fadeIn(animationDuration, function () {
				$('.nano').nanoScroller();
			})
		})
		$('#newtask').fadeOut(animationDuration, function () {
			$('#tasks').fadeIn(animationDuration, function () {
				$('.nano').nanoScroller();
			});
		});
	});

	$('#classList').hide();
	$('#cmdDeselect').click(function() {
		$('div.class.selected').removeClass('selected');
		app.classView.triggerSelectedChange();
	});

	$('.nano').nanoScroller({ preventPageScrolling: true, alwaysVisible: true });
});
