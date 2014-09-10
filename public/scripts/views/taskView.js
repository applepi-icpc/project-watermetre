var app = app || {};

var animationDuration = 500; // milliseconds
var rowHeight = '146px';

var TaskView = Backbone.View.extend({
	tagName: 'div',
	className: 'task',
	template: _.template($('#task-template').html()),

	events: {},

	initialize: function (option) {
		this.task = option.task;
		this.listenTo(this.task, 'change', this.render);
	},

	render: function () {
		var task = this.task;
		this.$el.html(this.template({
			user_id: task.get('user_id'),
			status: task.get('status'),
			attempts: task.get('attempts'),
			errors: task.get('errors'),
			last_error: task.get('last_error'),
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
			opacity: '0',
			height: '0'
		});
		$list.append(this.$el);
		this.$el.animate({
			opacity: '1',
			height: rowHeight
		}, animationDuration);
		return this;
	},

	fadeOut: function () {
		var $el = this.$el;
		$el.animate({
			opacity: '0',
			height: '0'
		}, animationDuration, function () {
			$el.remove();
		});
		return this;
	}
});

var TaskListView = Backbone.View.extend({
	initialize: function (option) {
		this.subViews = {};
		this.el = option.el;
		this.collection = option.collection;
		this.listenTo(this.collection, 'add', this.addOne);
		this.listenTo(this.collection, 'remove', this.removeOne);
		this.listenTo(this.collection, 'reset', this.refresh);
	},

	addOne: function (model, collection, option) {
		var id = model.get('_id');
		if (!this.subViews[id]) {
			var newTask = new TaskView({ task: model });
			this.subViews[id] = newTask;
			newTask.render();
			if (typeof option == 'object' && option.noAnimate) {
				this.$el.append(newTask.$el);
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
			this.subViews[id] = undefined;
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

app.taskView = new TaskListView({
	el: '#tasks div.board',
	collection: app.tasks
});