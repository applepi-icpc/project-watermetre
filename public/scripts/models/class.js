var app = app || {};

app.Class = Backbone.Model.extend({
	defaults: {
		name: '',
		teacher: '',
		msg: '',
		seq: '',
		ubound: 0,
		index: -1
	}
});

var ClassCollection = Backbone.Collection.extend({
	model: app.Class,
	url: '/classes'
});
app.classes = new ClassCollection();
