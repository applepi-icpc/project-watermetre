// This script runs on satellite computers, which is to send actual requests to elective system.
var http = require('http');
var https = require('https');
var _ = require('underscore');
var url = require('url');
var identifier = require('utility/identify.js');

// Heartbeat interval.
var heartbeatInterval = 5000; // ms;

// Timeout.
var timeout = 10000; // ms

// Home planet's host.
var host = 'www.watermetre.net';

// Retrying options.
var maxRetry = 10;
var retryIdentifyTime = 500; // ms

// For simplifying, ignore all uncaught exceptions.
// process.on('uncaughtException', function (err) {});

// POST / with {jsessionid, seq, index}
http.createServer(function(req, res) {
	var parsedUrl = url.parse(req.url);
	if (parsedUrl.pathname != '/' || req.method != 'POST') {
		res.writeHead(404);
		res.end();
	} else {
		var buffers = [];
		var len = 0;
		req.on('data', function (chunk) {
			buffers.push(chunk);
			len += chunk.length;
		});
		req.on('end', function () {
			var bufferRaw = Buffer.concat(buffers, len);
			var json = bufferRaw.toString('utf8');
			var workObject = JSON.parse(json);

			var resFunction = function (result) {
				var toSend = JSON.stringify(result);
				res.writeHead(200, {
					'Content-Length': (new Buffer(toSend, 'utf8')).length,
					'Content-Type': 'text/plain'
				});
				res.write(toSend, 'utf8');
				res.end();
			};

			var workFunction = function (retried) {
				identifier.tryIdentify(workObject.jsessionid, function (err, success) {
					// result: OK, Full, Expired, RetriedTooMany
					var result = {};
					result.wrong = 0;
					result.correct = 0;

					if (err == 'Session expired.') {
						result.status = 'Expired';
						return resFunction(result);
					} else if (err || !success) {
						if (!success) {
							++result.wrong;
						}
						if (retried < maxRetry) {
							setTimeout(workFunction, retryIdentifyTime, retried + 1);
						} else {
							result.status = 'RetriedTooMuch';
							return resFunction(result);
						}
					} else {
						++result.correct;

						// TODO: Finish the actual code.

						result.status = 'Full';
						return resFunction(result);
					}
				});
			};

			workFunction(0);
		});
	}
}).listen(3333);
console.log('Satellite start to listen port 3333.');

setInterval(function () {
	var req = https.request({
		hostname: host,
		path: '/satellites/heartbeat',
		method: 'POST',
		rejectUnauthorized: false
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
console.log('Heartbeat start.');

