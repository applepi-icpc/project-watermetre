var app = app || {};

app.loadTask = function (callback) {
	app.alert('Loading tasks...', true);
	app.tasks.fetch({
		reset: true,
		success: function () {
			app.hideAlert(500);
			if (callback) callback();
		},
		error: function (collection, response) {
			app.alert('Loading error: ' + response.error);
		}
	});
};