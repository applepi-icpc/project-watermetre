var express = require('express');
var router = express.Router();
var settings = require('../settings.js');
var identifier = require('../utility/identify.js');
var Users = require('./users.js');
var Task = require('../models/task.js');
var _ = require('underscore');

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

module.exports = router;
