var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Users = require('./users.js');
var Task = require('../models/task.js');

router.checkUser = function checkUserWithTaskId (req, res, next) {
	Task.get(req.params.taskId, function(err, task) {
		if (err) {
			res.status(500);
			return res.json({error: err});
		} else if (!task) {
			res.status(400);
			return res.json({error: 'Task not found.'});
		} else {
			if (!req.session || !req.session.user) {
				res.status(403);
				return res.json({error: 'Not logged in.'});
			}
			var sessionId = req.session.user.id;
			if (sessionId == 'edge' || task.user_id == sessionId) {
				next();
			} else {
				res.status(403);
				return res.json({error: 'Access denied.'});
			}
		}
	});
};

router.post('/', Users.checkSuperuser);
router.post('/', function(req, res) {
	if (req.body._id) {
		res.status(400);
		return res.json({error: 'Posting an existing task (with _id property).'});
	} else {
		var newTask = new Task(req.body);
		newTask.create(function(err, task) {
			if (err) {
				res.status(500);
				return res.json({error: err});
			} else {
				res.status(201);
				return res.json(task);
			}
		});
	}
});

router.get('/', Users.checkLoggedIn);
router.get('/', function(req, res) {
	var sessionId = req.session.user.id;
	Task.getAll(sessionId, function(err, tasks) {
		if (err) {
			res.status(500);
			return res.json({error: err});
		} else {
			res.status(200);
			return res.json(tasks);
		}
	});
});

router.get('/:taskId', router.checkUser);
router.get('/:taskId', function(req, res) {
	Task.get(req.params.taskId, function(err, task) {
		if (err || !task) {
			res.status(500);
			return res.json({error: err || 'Unable to find an existing task again.'});
		} else {
			res.status(200);
			return res.json(task);
		}
	});
});

router.put('/start/:taskId', router.checkUser);
router.put('/start/:taskId', function(req, res) {
	Task.get(req.params.taskId, function(err, task) {
		if (err || !task) {
			res.status(500);
			return res.json({error: err || 'Unable to find an existing task again.'});
		} else {
			var err = task.start();
			if (err) {
				res.status(500);
				return res.json({error: err});
			} else {
				res.status(201);
				return res.json(task);
			}
		}
	});
});

router.put('/suspend/:taskId', router.checkUser);
router.put('/suspend/:taskId', function(req, res) {
	Task.get(req.params.taskId, function(err, task) {
		if (err || !task) {
			res.status(500);
			return res.json({error: err || 'Unable to find an existing task again.'});
		} else {
			var err = task.suspend();
			if (err) {
				res.status(500);
				return res.json({error: err});
			} else {
				res.status(201);
				return res.json(task);
			}
		}
	});
});

router.put('/restart/:taskId', router.checkUser);
router.put('/restart/:taskId', function(req, res) {
	Task.get(req.params.taskId, function(err, task) {
		if (err || !task) {
			res.status(500);
			return res.json({error: err || 'Unable to find an existing task again.'});
		} else {
			var err = task.restart();
			if (err) {
				res.status(500);
				return res.json({error: err});
			} else {
				res.status(201);
				return res.json(task);
			}
		}
	});
});

router.delete('/:taskId', router.checkUser);
router.delete('/:taskId', function(req, res) {
	Task.get(req.params.taskId, function(err, task) {
		if (err) {
			res.status(500);
			return res.json({error: err});
		} else if (task) {
			task.remove(function(err) {
				if (err) {
					res.status(500);
					return res.json({error: err});
				} else {
					res.status(204);
					return res.json({});
				}
			});
		} else {
			res.status(204);
			return res.json({});
		}
	});
});

module.exports = router;