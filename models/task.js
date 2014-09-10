var db = require('./db.js');
var ObjectId = require('mongodb').ObjectId;
var Worker = require('./worker.js');
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
			className: element.className
		};
		classes.push(newClass);
	});
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
	if (this._id) {
		return statusHash[this._id];
	} else {
		return undefined;
	}
}
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
				task: this
			});
			workerHash[this._id].push(worker);
		}, this);
	}
};

// Synchronous functions.
// Returns an error, or null indicating operated successfully.

Task.prototype.suspend = function suspend() {
	try {
		if (workerHash[this._id]) {
			_.each(workerHash[this._id], function (worker) {
				worker.stop();
			});
		}
	} catch(err) {
		return err;
	}
	this.changeStatus('paused');
};
Task.prototype.start = function start() {
	try {
		if (workerHash[this._id]) {
			_.each(workerHash[this._id], function (worker) {
				worker.start();
			});
		}
	} catch(err) {
		return err;
	}
	this.changeStatus('running');
};

Task.prototype.restart = function restart() {
	var self = this;
	var err = self.suspend();
	if (err) return err;

	self.resetStat();

	err = self.start();
	if (err) return err;
	else return null;
};

Task.prototype.remove = function remove(callback) {
	var self = this;
	if (self._id) {
		db.collection('tasks', function(err, collection) {
			if (err) {
				return callback(err);
			}
			collection.remove({ _id: ObjectId.createFromHexString(self._id)}, function(err) {
				if (!err) {
					workerHash[self._id] = undefined;
				}
				callback(err);
			});
		});
	} else {
		return callback();
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
				cursor.toArray(function(err, docs) {
					if (err) {
						return callback(err);
					} else {
						_.each(docs, function (task) {
							task.ensureStat();
							task.stat = _.clone(task.getStat());
							task.ensureStatus();
							task.status = _.clone(task.getStatus());
						});
						return callback(null, docs);
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
			_.each(tasks, function (task) {
				task.createWorkers();
				task.start();
			});
			callback();
		}
	});
};