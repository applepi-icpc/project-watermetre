var app = app || {};

var animationDuration = 250; // milliseconds

var ClassView = Backbone.View.extend({
	tagName: 'div',
	className: 'class',
	template: _.template($('#class-template').html()),

	events: {
		'click div.command.select': 'select',
		'click div.command.deSelect': 'deSelect'
	},

	initialize: function (option) {
		this.class = option.class;
		this.titleView = option.titleView;
		this.listenTo(this.class, 'change', this.render);
	},

	render: function () {
		this.$el.html(this.template({
			teacher: this.class.get('teacher'),
			message: this.class.get('msg')
		}));
	},

	select: function () {
		this.$el.addClass('selected');
		this.titleView.trigger('changeSelected');
	},

	deSelect: function () {
		this.$el.removeClass('selected');
		this.titleView.trigger('changeSelected');
	}
});

var ClassTitleView = Backbone.View.extend({
	tagName: 'div',
	className: 'classTitle',
	template: _.template($('#class-title-template').html()),

	events: {
		'click h3': 'open',
		'click span.selectAll': 'selectAll'
	},

	initialize: function (option) {
		this.subViews = [];
		this.title = option.title;
		this.classArray = option.classArray;
		this.on('changeSelected', function () {
			var s = this.$('div.classContainer div.class.selected').size();
			this.$('span.selectCount').text(s);
			if (!s) this.$('span.selectIndicator').hide();
			else this.$('span.selectIndicator').show();

			$('#blkSelectedItem').text($('div.class.selected').size());
		});
	},

	render: function () {
		_.each(this.subViews, function (subView) {
			subView.remove();
		}, this);
		this.subViews = [];
		this.$el.html(this.template({
			title: this.title
		}));
		this.trigger('changeSelected');
		_.each(this.classArray, function (model) {
			var newClass = new ClassView({
				class: model,
				titleView: this
			});
			newClass.render();
			this.subViews.push(newClass);
			this.$('div.classContainer').append(newClass.$el);
		}, this);
	},

	open: function () {
		this.$el.toggleClass('open');
		if (this.$el.hasClass('open')) {
			this.$('div.classContainer').fadeIn(animationDuration / 2);
		} else {
			this.$('div.classContainer').hide();
		}
		$('.nano').nanoScroller();
	},

	selectAll: function (event) {
		event.stopPropagation();
		_.each(this.subViews, function (view) {
			view.select();
		});
	}
});

var ClassListView = Backbone.View.extend({
	initialize: function (option) {
		this.subViews = [];
		this.el = option.el;
		this.collection = option.collection;
		this.listenTo(this.collection, 'add', this.render);
		this.listenTo(this.collection, 'remove', this.render);
		this.listenTo(this.collection, 'reset', this.render);
	},

	render: function () {
		var self = this;
		this.$el.fadeOut(animationDuration, function () {
			_.each(self.subViews, function (subView) {
				subView.remove();
			}, self);
			self.subViews = [];
			if (self.collection.size == 0) {
				return;
			}
			var hash = {};
			self.collection.each(function(element) {
				if (hash[element.get('name')] === undefined) {
					hash[element.get('name')] = [];
				}
				hash[element.get('name')].push(element);
			}, self);
			_.each(hash, function (classArray, title) {
				var newClassTitle = new ClassTitleView({
					title: title,
					classArray: classArray
				});
				newClassTitle.render();
				this.subViews.push(newClassTitle);
				this.$el.append(newClassTitle.$el);
			}, self);
			self.$el.fadeIn(animationDuration);
			$('.nano').nanoScroller();
		});
	},

	triggerSelectedChange: function () {
		_.each(this.subViews, function (view) {
			view.trigger('changeSelected');
		});
	}
});

app.classView = new ClassListView({
	el: '#classList',
	collection: app.classes,
});