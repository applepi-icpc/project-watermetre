var http = require('http');
var settings = require('../settings.js');

var exports = {};
module.exports = exports;

var expireTime = 20000; // ms
var timeout = 10000; // ms

exports.lastHeartbeat = {}; // stores ip => lastHeartbeat (Unix time)
exports.lastHeartbeat[settings.hostIP] = new Date().getTime();
exports.queue = [ settings.hostIP ]; // stores ip

// callback(err, status)
exports.sendRequest = function (jsessionid, seq, index, callback) {
	var satellite;
	var now = new Date().getTime();
	while (exports.queue.length > 0) {
		satellite = exports.queue.shift();
		if (now - exports.lastHeartbeat[satellite] <= expireTime) break;
		else {
			delete exports.lastHeartbeat[satellite];
			satellite = undefined;
		}
	}
	if (!satellite) {
		return callback('No avaliable satellites.');
	}
	exports.queue.push(satellite);

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
			var res = Buffer.concat(buffers, len).toString('utf8');
			if (res == 'OK') {
				return callback(null, 'OK');
			} else if (res == 'Full') {
				return callback(null, 'Full');
			} else {
				return callback(res);
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
	req.write(JSON.stringify({
		jsessionid: jsessionid,
		seq: seq,
		index: index
	}), 'utf8');
	req.end();
};
