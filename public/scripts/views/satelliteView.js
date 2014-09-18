var app = app || {};

var updateSatelliteInterval = 5000;
var height = '60px';

var animationDuration = 500; // milliseconds

var SatelliteView = Backbone.View.extend({
	tagName: 'div',
	className: 'satellite',
	template: _.template($('#satellite-template').html());

	events: {
		'click div.b-start': 'start',
		'click div.b-pause': 'suspend'
	},

	initialize: function (option) {
		this.satellite = option.satellite;
		this.listenTo(this.satellite, 'change', this.render);
	},

	render: function () {
		var satellite = this.satellite;
		var lat;
		if (satellite.get('latency') < 0) {
			lat = 'Not yet succeeded';
		} else {
			lat = parseInt(satellite.get('latency')) + 'ms';
		}
		this.$el.html(this.template({
			ip: satellite.get('ip'),
			status: satellite.get('paused') ? 'Paused' : 'Running',
			latency: lat
		}));
		if (satellite.get('paused')) {
			this.$el.addClass('paused');
		} else {
			this.$el.removeClass('succeeded');
		}
		return this;
	},

	fadeIn: function ($list) {
		this.$el.css({
			opacity: 0,
			height: 0
		});
		$list.append(this.$el);
		this.$el.animate({
			opacity: '1',
			height: rowHeight
		}, animationDuration, function () {
			$('.nano').nanoScroller();
		});
		return this;
	},

	fadeOut: function () {
		var $el = this.$el;
		$el.animate({
			opacity: 0,
			height: 0
		}, animationDuration, function () {
			this.remove();
			$('.nano').nanoScroller();
		});
		return this;
	},

	start: function () {
		this.satellite.start();
	},

	suspend: function () {
		this.satellite.suspend();
	}
});

var SatelliteListView = Backbone.View.extend({
	initialize: function (option) {
		this.subViews = {};
		this.el = option.el;
		this.collection = option.collection;
		this.listenTo(this.collection, 'add', this.addOne);
		this.listenTo(this.collection, 'remove', this.removeOne);
		this.listenTo(this.collection, 'destroy', this.removeOne);
		this.listenTo(this.collection, 'reset', this.refresh);
	},

	addOne: function (model, collection, option) {
		var id = model.get('ip');
		if (!this.subViews[id]) {
			var newView = new SatelliteView({ satellite: model });
			this.subViews[id] = newView;
			newView.render();
			if (typeof option == 'object' && option.noAnimate) {
				this.$el.append(newView.$el);
				$('.nano').nanoScroller();
			} else {
				newView.fadeIn(this.$el);
			}
		}
	},

	removeOne: function (model, collection, option) {
		var id = model.get('ip');
		if (this.subViews[id]) {
			var delTask = this.subViews[id];
			delete this.subViews[id];
			delTask.fadeOut();
		}
	},

	refresh: function () {
		_.each(this.subViews, function (subView) {
			subView.remove();
		});
		this.subViews = {};
		this.collection.each(function (model) {
			this.addOne(model, this, { noAnimate: true });
		}, this);
	}
});

app.satelliteView = new SatelliteListView({
	el: '#satellites div.board',
	collection: app.satellites
});

app.updateSatelliteNumber = function () {
	$.ajax({
		url: '/satellites',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		context: this,
		error: function () {
			app.alert("Error occured when retrieving satellite data.");
		},
		success: function (satellites) {
			$('#blkSatellites').text(_.size(satellites));
			app.satellites.set(satellites);
		}
	});
};

$(function () {
	setInterval(app.updateSatelliteNumber, updateSatelliteInterval);
});