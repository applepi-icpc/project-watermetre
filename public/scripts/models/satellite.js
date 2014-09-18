var app = app || {};

app.Satellite = Backbone.Model.extend({
	idAttribute: 'ip',
	defaults: {
		ip: '',
		paused: false,
		isHost: false,
		lastBeat: 0,
		latency: -1
	},

	start: function (errorCallback) {
		$.ajax({
			url: '/satellites/pause/' + this.id,
			type: 'DELETE',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Satellite operation error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Satellite operation error: ' + err);
				}
				errorCallback(jqXHR, textStatus, err);
			},
			success: function () {
				this.set('paused', false);
			}
		});
	},

	suspend: function (errorCallback) {
		$.ajax({
			url: '/satellites/pause/' + this.id,
			type: 'PUT',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function (jqXHR, textStatus, err) {
				if (jqXHR.status == 500) {
					app.alert('Satellite operation error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				} else {
					app.alert('Satellite operation error: ' + err);
				}
				errorCallback(jqXHR, textStatus, err);
			},
			success: function () {
				this.set('paused', true);
			}
		});
	}
});

var SatelliteCollection = Backbone.Collection.extend({
	model: app.Satellite,
	url: '/satellites'
});
app.satellites = new SatelliteCollection();
