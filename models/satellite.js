var http = require('http');
var settings = require('../settings.js');
var identifier = require('../utility/identify.js');
var crypto = require('crypto');
var _ = require('underscore');

var User = require('../models/user.js');

var exports = {};
module.exports = exports;

var expireTime = 20000; // ms
var timeout = 10000; // ms

exports.lastHeartbeat = {}; // stores ip => lastHeartbeat (Unix time)
exports.latency = {}; // ip => latancy (milliseconds)
exports.pause = {};

exports.lastHeartbeat[settings.hostIP] = new Date().getTime();
exports.queue = [ settings.hostIP ]; // stores ip

// callback(err, status)
exports.sendRequest = function (jsessionid, seq, index, ubound, taskId, callback) {
	var satellite;
	var now = new Date().getTime();
	var tque = []
	while (exports.queue.length > 0) {
		satellite = exports.queue.shift();
		if (exports.pause[satellite]) {
			tque.push(satellite);
		}
		else if (now - exports.lastHeartbeat[satellite] <= expireTime) break;
		else {
			delete exports.lastHeartbeat[satellite];
			delete exports.latency[satellite];
			satellite = undefined;
		}

	}
	_.each(tque, function (sate) {
		exports.queue.push(sate);
	});
	tque = [];
	if (!satellite) {
		return callback('No avaliable satellites.');
	}
	exports.queue.push(satellite);

	var plain = JSON.stringify({
		jsessionid: jsessionid,
		seq: seq,
		index: index,
		ubound: ubound,
		taskId: taskId
	});
	var cipher = crypto.createCipher('aes192', settings.edgePassword);
	var toSend = cipher.update(plain, 'utf8', 'base64');
	toSend += cipher.final('base64');

	var now = new Date().getTime();
	var req = http.request({
		host: satellite,
		port: 3333,
		path: '/',
		method: 'POST'
	}, function (response) {
		var buffers = [];
		var len = 0;
		response.on('data', function (chunk) {
			buffers.push(chunk);
			len += chunk.length;
		});
		response.on('end', function () {
			var res = JSON.parse(Buffer.concat(buffers, len).toString('utf8'));
			var lat = new Date().getTime() - now;

			if (!exports.latency[satellite]) {
				exports.latency[satellite] = lat;
			} else {
				exports.latency[satellite] = exports.latency[satellite] * 0.6667 + lat * 0.3333;
			}

			console.log('From satellite ' + satellite + ': (' + lat + ' ms)');
			console.log(res);

			if (res.status == 'OK') {
				return callback(null, 'OK');
			} else if (res.status == 'Full') {
				return callback(null, 'Full');
			} else if (res.status == 'Expired') {
				return callback(null, 'Expired');
			} else if (res.status == 'RetriedTooMuch') {
				return callback('Satellite: Retried too many times');
			} else {
				return callback(res.err);
			}
		});
	});
	req.on('socket', function (socket) {
		socket.setTimeout(timeout);
		socket.on('timeout', function () {
			req.abort();
		});
	});
	req.on('error', function (err) {
		return callback("Satellite error.");
	});
	req.write(toSend, 'utf8');
	req.end();
};
