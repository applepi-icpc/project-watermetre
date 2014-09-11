var Task = require('./user.js');
var settings = require('../settings.js');
var _ = require('underscore');

function Worker(worker) {
	this.user_id = worker.user_id;
	this.password = worker.password;
	this.index = worker.index;
	this.seq = worker.seq;

	// Reference to task
	this.task = worker.task;

	// !timeoutId => not running
	this.intervalId = null;
};
module.exports = Worker;

// callback(err, ended)
Worker.prototype.work = function work (callback) {
	var self = this;

	// TODO: Finish this core function

	// Test code here.
	self.task.ensureStat();
	var stat = self.task.getStat();

	if (stat.attempts >= 500) {
		_.delay(callback, 1000, null, true);
	} else if (stat.attempts == 4 || stat.attempts == 12) {
		_.delay(callback, 1000, "Test error.", false);
	} else {
		_.delay(callback, 1000, null, false);
	}
};
Worker.prototype.start = function start () {
	var self = this;
	if (!self.intervalId) {
		// TODO: Try to login and store jsession ID.
		// If login failed, change tasks' status to paused, and remain intervalId null.

		self.intervalId = setInterval(function() {
			self.work(function(err, ended) {
				self.task.ensureStat();
				var stat = self.task.getStat();
				self.task.ensureStatus();
				var status = self.task.getStatus();

				++stat.attempts;
				if (err) {
					++stat.errors;
					stat.last_error = err;
				} 
				if (ended) {
					self.task.succeed();
				}
			});
		}, settings.retryInterval);
	}
};
Worker.prototype.stop = function stop () {
	clearInterval(this.intervalId);
	this.intervalId = null;
}