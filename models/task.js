var db = require('./db.js');
var ObjectId = require('mongodb').ObjectId;
var Worker = require('./worker.js');
var ObjectId = require('mongodb').ObjectID;
var _ = require('underscore');

var statHash = {};
var statusHash = {};
var workerHash = {};

function Task(task) {
	this.user_id = task.user_id;
	this.password = task.password;

	if (task._id) {
		this._id = task._id;
	}

	// Information for worker
	// {index, seq, className}
	this.classes = [];
	_.each(task.classes, function (element) {
		var newClass = {
			index: element.index,
			seq: element.seq,
			ubound: element.ubound,
			className: element.className
		};
		this.classes.push(newClass);
	}, this);
};
module.exports = Task;

Task.prototype.ensureStatus = function ensureStatus () {
	if (this._id) {
		if (!statusHash[this._id]) {
			statusHash[this._id] = 'paused';
		}
	}
};
Task.prototype.changeStatus = function changeStatus (status) {
	if (this._id) {
		statusHash[this._id] = status;
	}
};
Task.prototype.getStatus = function getStatus () {
	this.ensureStatus();
	if (this._id) {
		return statusHash[this._id];
	} else {
		return undefined;
	}
};
Task.prototype.ensureStat = function ensureStat () {
	if (this._id) {
		if (!statHash[this._id]) {
			statHash[this._id] = {
				attempts: 0,
				errors: 0,
				last_error: null
			};
		}
	}
};
Task.prototype.resetStat = function resetStat() {
	if (this._id) {
		statHash[this._id] = {
			attempts: 0,
			errors: 0,
			last_error: null
		};
	}
};
Task.prototype.getStat = function getStat () {
	this.ensureStat();
	if (this._id) {
		return statHash[this._id];
	} else {
		return undefined;
	}
}

// callback(err, newTask)
Task.prototype.create = function create(callback) {
	if (!this._id) {
		var newTask = new Task(this);
		var self = this;
		db.collection('tasks', function(err, collection) {
			if (err) {
				return callback(err);
			}
			collection.insert(newTask, {safe: true}, function(err, tasks) {
				if (!err) {
					self._id = tasks[0]._id;
					self.createWorkers();
					self.start();
					callback(err, tasks[0]);
				}
				else {
					callback(err);
				}
			});
		});
	} else {
		callback('Unable to create an existent task.');
	}
};

// Synchronous function
Task.prototype.createWorkers = function createWorkers() {
	if (!workerHash[this._id]) {
		workerHash[this._id] = [];
		_.each(this.classes, function (cl) {
			var worker = new Worker({
				user_id: this.user_id,
				password: this.password,
				index: cl.index,
				seq: cl.seq,
				ubound: cl.ubound,
				task: this
			});
			workerHash[this._id].push(worker);
		}, this);
	}
};

// Synchronous functions.
// Returns an error, or null indicating operated successfully.

// For now, no error will be returned...

Task.prototype.suspend = function suspend() {
	if (this.getStatus() == 'succeeded') {
		return "Task has already ended successfully."
	} else if (this.getStatus() == 'running' && workerHash[this._id]) {
		_.each(workerHash[this._id], function (worker) {
			worker.stop();
		});
		this.changeStatus('paused');
	}
};
Task.prototype.succeed = function suspend() {
	if (workerHash[this._id]) {
		_.each(workerHash[this._id], function (worker) {
			worker.stop();
		});
		this.changeStatus('succeeded');
	}
};
Task.prototype.start = function start() {
	if (this.getStatus() == 'succeeded') {
		return "Task has already ended successfully."
	} else if (this.getStatus() == 'paused' && workerHash[this._id]) {
		_.each(workerHash[this._id], function (worker, index) {
			// Workers are started in turn, delayed by an interval.
			_.delay(function () {
				worker.start();
			}, index * 500);
		});
		this.changeStatus('running');
	}
};

Task.prototype.restart = function restart() {
	if (this.getStatus() == 'succeeded') {
		return "Task has already ended successfully."
	} else {
		var self = this;
		var err = self.suspend();
		if (err) return err;

		self.resetStat();

		err = self.start();
		if (err) return err;
		else return null;
	}
};

Task.prototype.remove = function remove(callback) {
	var self = this;
	if (self._id) {
		db.collection('tasks', function(err, collection) {
			if (err) {
				if (callback) return callback(err);
				else return;
			}
			collection.remove({ _id: ObjectId.createFromHexString(self._id)}, function(err) {
				if (!err) {
					self.suspend();
					workerHash[self._id] = undefined;
				}
				if (callback) callback(err);
			});
		});
	} else {
		if (callback) return callback();
		else return;
	}
};

// callback(err, task)
Task.get = function get(_id, callback) {
	db.collection('tasks', function(err, collection) {
		if (err) {
			return callback(err);
		}
		collection.findOne({ _id: ObjectId.createFromHexString(_id)}, function(err, doc) {
			if (doc) {
				var task = new Task(doc);
				task._id = task._id.toHexString();

				task.ensureStat();
				task.stat = _.clone(task.getStat());
				task.ensureStatus();
				task.status = _.clone(task.getStatus());

				return callback(err, task);
			} else {
				return callback(err, null);
			}
		});
	});
};
// callback(err, tasks)
Task.getAll = function get(username, callback) {
	db.collection('tasks', function(err, collection) {
		if (err) {
			return callback(err);
		}
		var query = {};
		if (username && username != 'edge') {
			query.user_id = username;
		}
		collection.find(query, function(err, cursor) {
			if (err) {
				return callback(err);
			} else {
				tasks = [];
				cursor.toArray(function(err, docs) {
					if (err) {
						return callback(err);
					} else {
						_.each(docs, function (task) {
							task = new Task(task);
							task._id = task._id.toHexString();

							task.ensureStat();
							task.stat = _.clone(task.getStat());
							task.ensureStatus();
							task.status = _.clone(task.getStatus());

							tasks.push(task);
						});
						return callback(null, tasks);
					}
				});
			}
		});
	});
};
// Asynchronous function
// callback(err)
Task.initialize = function initialize (callback) {
	workerHash = {};
	Task.getAll('edge', function (err, tasks) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
			_.each(tasks, function (task, index) {
				task.createWorkers();
				task.start();
			});
			callback();
		}
	});
};
