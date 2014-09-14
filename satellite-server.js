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

			var workFunction = function (retried) {
				identifier.tryIdentify(workObject.jsessionid, function (err, success) {
					// result: OK, Full, Expired, RetriedTooMany, Error
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

						var reqSupplement = http.request({
							hostname: 'elective.pku.edu.cn',
							path: '/elective2008/edu/pku/stu/elective/controller/supplement/electSupplement.do?index=' + workObject.index + '&seq=' + workObject.seq,
							headers: {
								'cookie': 'JSESSIONID=' + jsessionid
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
									// Yeeeeeeeeeeeeeeah!!!
									result.status = 'OK';
								} else {
									var msg = s.match(/<label class=\'message_error\'>(.*?)<\/label>/)[1];
									if (msg == '该课程选课人数已满。') {
										result.status = 'Full';
									} else {
										result.status = 'Error';
										result.err = msg;
									}
								}

								return resFunction(result);
							});
						});
						reqSupplement.on('socket', function (socket) {
							socket.setTimeout(timeout);
							socket.on('timeout', function () {
								reqSupplement.abort();
							})
						});
						reqSupplement.on('error', function (err) {
							res.status(500);
							res.json({error: err});
						});
						reqSupplement.end();
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

