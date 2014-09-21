var Task = require('./user.js');
var Satellite = require('./satellite.js');
var User = require('./user.js');
var settings = require('../settings.js');

var http = require('http');
var _ = require('underscore');

var retryLoginTime = 1000; // ms
var retryIdentifyTime = 500; // ms
var maxConsecutiveError = 3;
var timeout = 15000;

// If satellites reports OK, wait it sends supplemented or refresh again.
var supplementTimeout = 30000;

function Worker(worker) {
	this.user_id = worker.user_id;
	this.password = worker.password;
	this.index = worker.index;
	this.seq = worker.seq;
	this.ubound = worker.ubound;
	this.launched = false;
	this.running = false;
	this.starting = false;
	this.timeoutId = null;

	// Reference to task
	this.task = worker.task;

	// Retry mark
	this.consecutiveError = 0;
};
module.exports = Worker;

// callback(err, ended)
Worker.prototype.work = function work (callback) {
	var self = this;

	console.log('[WORK] ' + self.user_id + ' ' + self.seq);

	self.task.ensureStat();
	var stat = self.task.getStat();

	Satellite.sendRequest(self.jsessionid, self.seq, self.index, self.ubound, self.task._id, function (err, status) {
		if (err || status == 'Expired') {
			++self.consecutiveError;
			if (self.consecutiveError > maxConsecutiveError) {
				self.stop();
				self.start();
			} else if (self.running) {
				self.timeoutId = setTimeout(function() { self.doWork(); }, settings.retryInterval);
			}
			if (status == 'Expired') return callback('Session expired.', false);
			else return callback(err, false);
		} else if (status == 'OK') {
			self.consecutiveError = 0;
			if (self.running) {
				self.timeoutId = setTimeout(function() { 
					stat.last_error = "Message: Refresh restarted.";
					self.doWork(); 
				}, supplementTimeout);
			}
			return callback(null, true);
		} else {
			self.consecutiveError = 0;
			if (self.running) {
				self.timeoutId = setTimeout(function() { self.doWork(); }, settings.retryInterval);
			}
			return callback(null, false);
		}
	});

};
Worker.prototype.doWork = function doWork () {
	var self = this;
	if (!self.running) return;
	self.task.ensureStat();
	var stat = self.task.getStat();
	self.work(function(err, ended) {
		++stat.attempts;
		if (err) {
			++stat.errors;
			stat.last_error = err.toString();
		} 
		if (ended) {
			// Wait satellites to do such thing.
			// self.task.succeed();
			stat.last_error = 'Message: Supplementing...';
		}
	});
};
Worker.prototype.start = function start (rep) {
	var self = this;

	if (self.starting) {
		console.log('[START] ' + self.user_id + ' is being started by other functions.');
		return;
	}

	self.starting = true;
	self.consecutiveError = 0;

	// For debug
	console.log('[START' + (rep ? ' REP' : '') + '] ' + self.user_id + ' ' + self.seq);

	if (rep) {
		if (!self.launched) {
			console.log('[START REP] ' + self.user_id + ' has been suspended.');
			return;
		}
	} else {
		self.launched = true;
	}
	if (self.running) {
		console.log('[START] ' + self.user_id + ' has already begun.');
		return;
	}

	// If login failed, change tasks' status to paused.
	User.login(self.user_id, self.password, function(err, statusCode, user) {
		if (self.running) return;

		self.task.ensureStat();
		var stat = self.task.getStat();

		if (statusCode == 500) { // Internal Server Error
			++stat.errors;
			stat.last_error = 'Failed to login (Internal Server Error).';
			self.starting = false;
			setTimeout(function () { self.start(true); }, retryLoginTime);
		} else if (statusCode == 403) { // Wrong user ID || Password
			++stat.errors;
			stat.last_error = 'Wrong user ID or password.';
			self.task.suspend();
		} else {
			self.jsessionid = user.jsessionid;
			var reqPage = http.request({
				hostname: 'elective.pku.edu.cn',
				path: '/elective2008/edu/pku/stu/elective/controller/supplement/SupplyCancel.do',
				headers: {
					'cookie': 'JSESSIONID=' + self.jsessionid
				},
				method: 'GET'
			}, function (response) {
				response.on('data', function() {});
				response.on('end', function() {
					if (self.running || !self.launched) return;
					self.running = true;
					self.starting = false;
					self.timeoutId = setTimeout(function() { self.doWork(); }, settings.retryInterval);
				});
			});
			reqPage.on('socket', function (socket) {
				socket.setTimeout(timeout);
				socket.on('timeout', function () {
					reqPage.abort();
				})
			});
			reqPage.on('error', function (err) {
				++stat.errors;
				stat.last_error = 'Failed to fetch supply page (Internal Server Error).'
				self.starting = false;
				setTimeout(function () { self.start(true); }, retryLoginTime);
			});
			reqPage.end();
		}
	});
};
Worker.prototype.stop = function stop () {
	if (this.timeoutId) clearTimeout(this.timeoutId);
	this.timeoutId = null;
	this.running = false;
	this.launched = false;
	this.starting = false;
}
