// This script runs on satellite computers, which is to send actual requests to elective system.

var http = require('http');
var https = require('https');
var _ = require('underscore');
var url = require('url');

// Heartbeat interval.
var heartbeatInterval = 5000; // ms;

// Timeout.
var timeout = 10000; // ms

// Home planet's host.
var host = 'www.watermetre.net';

// For simplifying, ignore all uncaught exceptions.
process.on('uncaughtException', function (err) {});

// POST / with {jsessionid, seq, index}
http.createServers(function(req, res) {
	var parsedUrl = url.parse(request.url);
	if (parsedUrl.pathname != '/' || request.method != 'POST') {
		response.writeHead(404);
		response.end();
	} else {
		var buffers = [];
		var len = 0;
		request.addListener('data', function (chunk) {
			buffers.push(chunk);
			len += chunk.length;
		);
		request.addListener('end', function () {
			var bufferRaw = Buffer.concat(buffers, len);
			var json = bufferRaw.toString('utf8');
			var workObject = JSON.parse(json);

			console.log(workObject);

			// TODO: Finish the actual code.

			// result: OK - succeeded, Full - not avaliable, Other - some exceptions
			var result = 'Full';
			response.writeHead(200, {
				'Content-Length': (new Buffer(result, 'utf8')).length,
				'Content-Type': 'text/plain'
			});
			response.write(result, 'utf8');
			response.end();
		});
	}
}).listen(3333);
console.log('Satellite start to listen port 3333').

setInterval(function () {
	var req = https.request({
		hostname: host,
		path: '/satellites/heartbeat',
		method: 'POST'
	}, function (response) {
		req.abort();
	});
	req.on('socket', function (socket) {
		socket.setTimeout(timeout);
		socket.on('timeout', function () {
			req.abort();
		});
	});
	req.on('error', function(err) {
		// Simply ignore the error.
	});
	req.end();
}, heartbeatInterval);
