// This script runs on satellite computers, which is to send actual requests to elective system.
var http = require('http');
var https = require('https');
var _ = require('underscore');
var url = require('url');
var identifier = require('./utility/identify.js');
var crypto = require('crypto');
var settings = require('./settings.js');

// Heartbeat interval.
var heartbeatInterval = 5000; // ms;

// Timeout.
var timeout = 15000; // ms

// Home planet's host.
var host = 'www.watermetre.net';

// Retrying options.
var maxRetry = 5;
var retryIdentifyTime = 500; // ms

// For simplifying, ignore all uncaught exceptions.
// process.on('uncaughtException', function (err) {});

// Send back.
var sendOK = function (taskId, correct, error) {
	var req = https.request({
		hostname: host,
		path: '/satellites/sendOK/' + taskId,
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
	req.write(querystring.stringify({
		correct: correct,
		error: error
	}));
	req.end();
}
var sendFailed = function (correct, error) {
	var req = https.request({
		hostname: host,
		path: '/satellites/sendFailed',
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
	req.write(querystring.stringify({
		correct: correct,
		error: error
	}));
	req.end();
}

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
			var jsonCipher = bufferRaw.toString('utf8');

			var decipher = crypto.createDecipher('aes192', settings.edgePassword);
			var json = decipher.update(jsonCipher, 'base64', 'utf8');
			json += decipher.final('utf8');

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

			// result: OK, Full, Expired, RetriedTooMany, Error
			var result = {};
			var correct = 0, wrong = 0;

			var workFunction = function (retried) {
				identifier.tryIdentify(workObject.jsessionid, function (err, success) {
					if (err || !success) {
						if (!err) {
							++wrong;
						}
						if (retried < maxRetry) {
							setTimeout(workFunction, retryIdentifyTime, retried + 1);
						} else {
							sendFailed(correct, error);
						}
					} else {
						++correct;

						var reqSupplement = http.request({
							hostname: 'elective.pku.edu.cn',
							path: '/elective2008/edu/pku/stu/elective/controller/supplement/electSupplement.do?index=' + workObject.index + '&seq=' + workObject.seq,
							headers: {
								'Cookie': 'JSESSIONID=' + workObject.jsessionid,
							},
							method: 'GET'
						}, function (response) {
							var buffers = [];
							var len = 0;
							response.on('data', function (chunk) {
								buffers.push(chunk);
								len += chunk.length;
							});
							response.on('end', function () {
								var resBody = Buffer.concat(buffers, len).toString('utf8');

								if (resBody.search('success.gif') != -1) {
									// Yeeeeeeeeeeeeeeaaaaaaaaaaaaaaaaaah!!!
									sendOK(workObject.taskId, correct, error);
								} else {
									sendFailed(correct, error);
								}
							});
						});
						reqSupplement.on('socket', function (socket) {
							socket.setTimeout(timeout);
							socket.on('timeout', function () {
								reqSupplement.abort();
							});
						});
						reqSupplement.on('error', function (err) {
							result.status = 'Error';
							result.err = 'Supplement error.';
							return resFunction(result);
						});
						reqSupplement.end();
					}
				});
			};
		
			var refreshFunction = function (retried) {
				var reqRefresh = http.request({
					hostname: 'elective.pku.edu.cn',
					path: '/elective2008/edu/pku/stu/elective/controller/supplement/refreshLimit.do?index=' + workObject.index + '&seq=' + workObject.seq,
					headers: {
						'Cookie': 'JSESSIONID=' + workObject.jsessionid
					},
					method: 'GET'
				}, function (response) {
					var buffers = [];
					var len = 0;
					response.on('data', function (chunk) {
						buffers.push(chunk);
						len += chunk.length;
					});
					response.on('end', function () {
						var resBody = Buffer.concat(buffers, len).toString('utf8');

						var match = resBody.match(/<electedNum>(\d+)<\/electedNum>/i);
						if (!match) {
							if (retried < maxRetry) {
								setTimeout(refreshFunction, retryIdentifyTime, retried + 1);
							} else {
								result.status = 'RetriedTooMuch';
								return resFunction(result);
							}
						} else {
							var elected = parseInt(match[1]);
							if (elected != workObject.ubound) {
								result.status = 'OK';
								resFunction(result);
								return workFunction(0);
							} else {
								result.status = 'Full';
								return resFunction(result);
							}
						}
					});
				});
				reqRefresh.on('socket', function (socket) {
					socket.setTimeout(timeout);
					socket.on('timeout', function () {
						reqRefresh.abort();
					});
				});
				reqRefresh.on('error', function (err) {
					result.status = 'Error';
					result.err = 'Refresh error.';
				});
				reqRefresh.end();
			};

			refreshFunction(0);
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

