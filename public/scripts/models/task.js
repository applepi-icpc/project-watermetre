var app = app || {};

var hideDuration = 500;

app.Task = Backbone.Model.extend({
	idAttribute: '_id',
	defaults: {
		user_id: '-1',
		status: 'invalid',
		stat: { attempts: 0, errors: 0, last_error: null },
		last_error: null,
		classes: [ "" ]
	},

	start: function (errorCallback) {
		if (this.isNew()) {
			app.alert('Internal error: Operated a new task model.')
		} else {
			$.ajax({
				url: '/tasks/start/' + this.id,
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
					errorCallback(jqXHR, textStatus, err);
				},
				success: function () {
					this.set('status', 'running');
				}
			});
		}
	},

	suspend: function (errorCallback) {
		if (this.isNew()) {
			app.alert('Internal error: Operated a new task model.')
		} else {
			$.ajax({
				url: '/tasks/suspend/' + this.id,
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
					errorCallback(jqXHR, textStatus, err);
				},
				success: function () {
					this.set('status', 'paused');
				}
			});
		}
	},

	restart: function (errorCallback) {
		if (this.isNew()) {
			app.alert('Internal error: Operated a new task model.')
		} else {
			$.ajax({
				url: '/tasks/restart/' + this.id,
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
					errorCallback(jqXHR, textStatus, err);
				},
				success: function () {
					this.set('stat', { attempts: 0, errors: 0, last_error: null });
					this.set('status', 'running');
				}
			});
		}
	},

	removeFromServer: function (errorCallback) {
		if (this.isNew()) {
			app.alert('Internal error: Operated a new task model.')
		} else {
			this.destroy({
				error: function (model, response) {
					if (jqXHR.status == 500) {
						app.alert('Task error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
					} else {
						app.alert('Task error: ' + err);
					}
					errorCallback(jqXHR, textStatus, err);
				}
			});
		}
	}
});

var TaskCollection = Backbone.Collection.extend({
	model: app.Task,
	url: '/tasks'
});
app.tasks = new TaskCollection();