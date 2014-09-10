var app = app || {};

app.Task = Backbone.Model.extend({
	idAttribute: '_id',
	urlRoot: '/tasks',
	defaults: {
		user_id: '-1',
		status: 'invalid',
		attempts: 0,
		errors: 0,
		last_error: null,
		classes: [ "" ]
	}
});

var TaskCollection = Backbone.Collection.extend({
	model: app.Task
});
app.tasks = new TaskCollection();