var app = app || {};

app.nowUserName = null;
app.nowPassword = null;

var animationDuration = 500;

$(function () {
	$('#newCommand').hide();

	// * All
	$('#cmdStartAll').click(function() {
		app.alert('Loading...', true);
		$.ajax({
			url: '/tasks/start',
			type: 'PUT',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Task error: ' + err);
				}
			},
			success: function () {
				app.loadTask();
			}
		});
	});

	$('#cmdRestartAll').click(function() {
		app.alert('Loading...', true);
		$.ajax({
			url: '/tasks/restart',
			type: 'PUT',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Task error: ' + err);
				}
			},
			success: function () {
				app.loadTask();
			}
		});
	});

	$('#cmdSuspendAll').click(function() {
		app.alert('Loading...', true);
		$.ajax({
			url: '/tasks/suspend',
			type: 'PUT',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Task error: ' + err);
				}
			},
			success: function () {
				app.loadTask();
			}
		});
	});

	$('#cmdRemoveAll').click(function() {
		app.alert('Loading...', true);
		$.ajax({
			url: '/tasks',
			type: 'DELETE',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Task error: ' + err);
				}
			},
			success: function () {
				app.loadTask();
			}
		});
	});

	// New Task
	$('#cmdNewTask').click(function() {
		app.classes.reset();
		app.nowUserName = app.nowPassword = null;
		$('input[name=query_user_id]').val('');
		$('input[name=query_password]').val('');
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

	// Cancel New Task
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

	// New Task OK
	$('#cmdOK').click(function() {
		if (!app.nowUserName) {
			app.alert('Please give your user ID and password and inquiry first.');
		} else if ($('div.class.selected').size() == 0) {
			app.alert('Please select some class first.');
		} else {
			var datapost = {
				user_id: app.nowUserName,
				password: app.nowPassword,
				classes: []
			};
			$('div.class.selected').each(function () {
				datapost.classes.push($(this).data('attachedClass'));
			});

			app.alert('Loading...', true);
			$.ajax({
				url: '/tasks',
				type: 'POST',
				data: datapost,
				dataType: 'json',
				timeout: 10000,
				context: this,
				error: function (jqXHR, textStatus, err) {
					if (jqXHR.status == 500) {
						app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
					} else {
						app.alert('Task error: ' + err);
					}
				},
				success: function () {
					$('#cmdCancelNewTask').click();
					app.loadTask();
				}
			});
		}
	});

	// Inquiry
	$('#inquiry').click(function() {
		app.nowUserName = $('input[name=query_user_id]').val();
		app.nowPassword = $('input[name=query_password]').val();

		// TODO: Retrieve data from server
		app.alert('Loading...', true);
		$.ajax({
			url: '/courses',
			type: 'GET',
			data: {
				username: app.nowUserName,
				password: app.nowPassword
			},
			dataType: 'json',
			timeout: 45000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Task error: ' + err);
				}
			},
			success: function (data) {
				app.classes.reset(data);
			}
		});
	});

	// Deselect All
	$('#cmdDeselect').click(function() {
		$('div.class.selected').removeClass('selected');
		app.classView.triggerSelectedChange();
	});

	// nanoScroller.js: Startup
	$('.nano').nanoScroller({ preventPageScrolling: true, alwaysVisible: true });
});
