var express = require('express');
var router = express.Router();
var settings = require('../settings.js');
var identifier = require('../utility/identify.js');
var User = require('../models/user.js');
var Users = require('./users.js');
var Task = require('../models/task.js');
var Parser = require('../models/parser.js');

var http = require('http');
var _ = require('underscore');

var timeout = 10000;

/* GET home page. */
router.get('/', function(req, res) {
	var user = req.session ? req.session.user : undefined;
  	res.render('index', {
  		username: (user ? user.id : undefined),
  		retryInterval: settings.retryInterval,
  		tried: identifier.tried,
  		correct: identifier.correct
  	});
});

// { val: newInterval }
router.put('/retryInterval', Users.checkSuperuser);
router.put('/retryInterval', function(req, res) {
	var sessionId = req.session.user.id;
	settings.retryInterval = req.body.val;

	// Restart all tasks
	Task.getAll(sessionId, function(err, tasks) {
		if (err) {
			res.status(500);
			return res.json({error: err});
		} else {
			_.each(tasks, function (task) {
				if (task.getStatus() != 'succeeded') {
					// Ignore all errors
					task.restart();
				}
			});
			res.status(201);
			res.json({});
		}
	});
});

// For now, PUT /stat will reset stat data, ignores request body.
router.put('/stat', Users.checkSuperuser);
router.put('/stat', function(req, res) {
	identifier.tried = identifier.correct = identifier.wrong = 0;
	res.status(201);
	res.json({});
});

router.get('/stat', function(req, res) {
	res.status(200);
	res.json({ tried: identifier.tried, correct: identifier.correct });
}); 

// Crucial route: Inquiry the candidate courses.
router.get('/courses', function(req, res) {
	if (req.body.username == edge) {
		res.status(400);
		res.json({error: "Don't inquiry edge's courses!"});
	} else {
		User.login(req.body.username, req.body.password, function (err, statusCode, user) {
			if (statusCode != 201) {
				res.status(statusCode);
				res.json({error: err});
			} else {
				var jsessionid = user.jsessionid;

				var reqPage = http.request({
					hostname: 'elective.pku.edu.cn',
					path: '/elective2008/edu/pku/stu/elective/controller/supplement/SupplyCancel.do',
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

						try {
							var cl = Parser.parseList(resBody);
							var tot = parseInt(Parser.parseTotalPage(resBody));
						} catch (err) {
							res.status(500);
							return res.json({error: err});
						}

						if (tot.isNaN()) {
							res.status(500);
							return res.json({error: "Page number is NaN."});
						}
						var append = function (pageNum) {
							var reqAp = http.request({
								hostname: 'elective.pku.edu.cn',
								path: '/elective2008/edu/pku/stu/elective/controller/supplement/supplement.jsp?netui_pagesize=electableListGrid%3B20&netui_row=electableListGrid%3B' + pageNum * 20,
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
									try {
										cl = cl.concat(Parser.parseList(resBody));
									} catch(err) {
										res.status(500);
										return res.json({error: err});
									}
									if (pageNum + 1 < tot) append(pageNum + 1);
									else {
										// Response result
										res.status(200);
										return res.json(cl);
									}
								});
							});
							reqAp.on('socket', function (socket) {
								socket.setTimeout(timeout);
								socket.on('timeout', function () {
									reqAp.abort();
								})
							});
							reqAp.on('error', function (err) {
								res.status(500);
								res.json({error: err});
							});
							reqAp.end();
						};

						append(1);
					});
				});
				reqPage.on('socket', function (socket) {
					socket.setTimeout(timeout);
					socket.on('timeout', function () {
						reqPage.abort();
					})
				});
				reqPage.on('error', function (err) {
					res.status(500);
					res.json({error: err});
				});
				reqPage.end();
			}
		});
	}
});

module.exports = router;
