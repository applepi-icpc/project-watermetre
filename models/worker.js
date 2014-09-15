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

function Worker(worker) {
	this.user_id = worker.user_id;
	this.password = worker.password;
	this.index = worker.index;
	this.seq = worker.seq;
	this.running = false;
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

	self.task.ensureStat();
	var stat = self.task.getStat();

	Satellite.sendRequest(self.jsessionid, self.seq, self.index, function (err, status) {
		if (err || status == 'Expired') {
			++self.consecutiveError;
			if (self.consecutiveError > maxConsecutiveError) {
				if (self.intervalId) {
					self.stop();
					self.start();
				}
			} else if (self.running) {
				self.timeoutId = setTimeout(function() { self.doWork(); }, settings.retryInterval);
			}
			if (status == 'Expired') return callback('Session expired.', false);
			else return callback(err, false);
		} else if (status == 'OK') {
			self.consecutiveError = 0;
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
	self.task.ensureStat();
	var stat = self.task.getStat();
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
};
Worker.prototype.start = function start () {
	var self = this;
	self.consecutiveError = 0;

	// For debug
	console.log('Start worker: ');
	console.log(self);

	if (!self.intervalId) {
		// If login failed, change tasks' status to paused, and remain intervalId null.
		User.login(self.user_id, self.password, function(err, statusCode, user) {
			self.task.ensureStat();
			var stat = self.task.getStat();

			if (statusCode == 500) { // Internal Server Error
				++stat.errors;
				console.log('Login process get 500: ');
				console.log(err);
				stat.last_error = 'Failed to login (Internal Server Error).'
				setTimeout(function () { self.start(); }, retryLoginTime);
			} else if (statusCode == 403) { // Wrong user ID || Password
				++stat.errors;
				stat.last_error = 'Wrong user ID or password.'
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
					var buffers = [];
					var len = 0;
					response.on('data', function (chunk) {
						buffers.push(chunk);
						len += chunk.length;
					});
					response.on('end', function() {
						self.running = true;
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
					setTimeout(function () { self.start(); }, retryLoginTime);
				});
				reqPage.end();
			}
		});
	}
};
Worker.prototype.stop = function stop () {
	if (this.timeoutId) clearTimeout(this.timeoutId);
	this.timeoutId = null;
	this.running = false;
}
