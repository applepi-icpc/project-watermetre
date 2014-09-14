var Task = require('./user.js');
var Satellite = require('./satellite.js');
var User = require('./user.js');
var settings = require('../settings.js');
var _ = require('underscore');

var retryLoginTime = 1000; // ms
var retryIdentifyTime = 500; // ms

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

	self.task.ensureStat();
	var stat = self.task.getStat();

	Satellite.sendRequest(self.jsessionid, self.seq, self.index, function (err, status) {
		if (err) {
			return callback(err, false);
		} else if (status == 'OK') {
			return callback(null, true);
		} else if (status == 'Expired') {
			++stat.errors;
			stat.last_error = 'Session expired.';
			this.stop();
			this.start();
		} else {
			return callback(null, false);
		}
	});

};
Worker.prototype.start = function start () {
	var self = this;
	if (!self.intervalId) {
		// If login failed, change tasks' status to paused, and remain intervalId null.
		User.login(self.user_id, self.password, function(err, statusCode, user) {
			self.task.ensureStat();
			var stat = self.task.getStat();

			if (statusCode == 500) { // Internal Server Error
				++stat.errors;
				stat.last_error = 'Failed to login (Internal Server Error).'
				setTimeout(self.start, retryLoginTime);
			} else if (statusCode == 403) { // Wrong user ID || Password
				++stat.errors;
				stat.last_error = 'Wrong user ID or password.'
				self.task.suspend();
			} else {
				self.jsessionid = user.jsessionid;
				self.intervalId = setInterval(function() {
					self.work(function(err, ended) {
						++stat.attempts;
						if (err) {
							++stat.errors;
							stat.last_error = err.toString();
						} 
						if (ended) {
							self.task.succeed();
						}
					});
				}, settings.retryInterval);
			}
		});
	}
};
Worker.prototype.stop = function stop () {
	clearInterval(this.intervalId);
	this.intervalId = null;
}
