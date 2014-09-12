var app = app || {};

var animationDuration = 500; // milliseconds
var animationLoading = 200;
var rowHeight = '146px';

var TaskView = Backbone.View.extend({
	tagName: 'div',
	className: 'task',
	template: _.template($('#task-template').html()),

	events: {
		'click div.command.start': 'start',
		'click div.command.pause': 'suspend',
		'click div.command.restart': 'restart',
		'click div.command.remove': 'removeFromServer'
	},

	initialize: function (option) {
		this.task = option.task;
		this.listenTo(this.task, 'change', this.render);
	},

	render: function () {
		var task = this.task;
		this.$el.html(this.template({
			user_id: task.get('user_id'),
			status: task.get('status'),
			attempts: task.get('stat').attempts,
			errors: task.get('stat').errors,
			last_error: task.get('stat').last_error,
			classes: task.get('classes')
		}));
		if (task.get('status') == 'succeeded') {
			this.$el.addClass('succeeded');
		}
		else {
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
		this.$('div.loadingBar').fadeIn(animationLoading);
		this.task.start(function () { this.$('div.loadingBar').fadeOut(animationLoading); });
	},
	suspend: function () {
		this.$('div.loadingBar').fadeIn(animationLoading);
		this.task.suspend(function () { this.$('div.loadingBar').fadeOut(animationLoading); });
	},
	restart: function () {
		this.$('div.loadingBar').fadeIn(animationLoading);
		this.task.restart(function () { this.$('div.loadingBar').fadeOut(animationLoading); });
	},
	removeFromServer: function () {
		this.$('div.loadingBar').fadeIn(animationLoading);
		this.task.removeFromServer(function () { this.$('div.loadingBar').fadeOut(animationLoading); });
	}
});

var TaskListView = Backbone.View.extend({
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
		var id = model.get('_id');
		if (!this.subViews[id]) {
			var newTask = new TaskView({ task: model });
			this.subViews[id] = newTask;
			newTask.render();
			this.$('div.taskIdentifier').hide(animationDuration);
			if (typeof option == 'object' && option.noAnimate) {
				this.$el.append(newTask.$el);
				$('.nano').nanoScroller();
			}
			else {
				newTask.fadeIn(this.$el);
			}
		}
	},

	removeOne: function (model, collection, option) {
		var id = model.get('_id');
		if (this.subViews[id]) {
			var delTask = this.subViews[id];
			delete this.subViews[id];
			delTask.fadeOut();
		}
		if (this.collection.size() == 0) {
			this.$('div.taskIdentifier').show(animationDuration);
		}
	},

	refresh: function () {
		_.each(this.subViews, function (subView) {
			subView.remove();
		});
		this.subViews = {};
		if (this.collection.size() == 0) {
			this.$('div.taskIdentifier').show(animationDuration);
		}
		this.collection.each(function (model) {
			this.addOne(model, this, { noAnimate: true });
		}, this);
	}
});

app.taskView = new TaskListView({
	el: '#tasks div.board',
	collection: app.tasks
});