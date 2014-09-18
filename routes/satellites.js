var express = require('express');
var router = express.Router();
var identifier = require('../utility/identify.js');
var settings = require('../settings.js');
var Users = require('./users.js');
var Task = require('../models/task.js');

var Satellite = require('../models/satellite.js');
var _ = require('underscore');

router.post('/heartbeat', function (req, res) {
	var ip = req.ip;
	if (!Satellite.lastHeartbeat[ip]) {
		Satellite.queue.push(ip);
	}
	Satellite.lastHeartbeat[ip] = new Date().getTime();
	res.status(201);
	return res.json({});
});

router.get('/', function (req, res) {
	var ori = Satellite.lastHeartbeat;
	var ret = []
	_.each(ori, function (beatTime, satellite) {
		ret.push({
			ip: satellite,
			lastBeat: beatTime,
			latency: Satellite.latency[satellite] || -1,
			paused: Satellite.pause[satellite] ? true : false,
			isHost: satellite == settings.hostIP
		});
	});
	res.status(200);
	return res.json(ret);
});

router.post('/sendFailed', function (req, res) {
	var correct = parseInt(req.body.correct);
	var wrong = parseInt(req.body.wrong);

	identifier.tried += correct + wrong;
	identifier.correct += correct;
	identifier.wrong += wrong;

	res.status(201);
	return res.json({});
});

router.post('/sendOK/:taskId', function (req, res) {
	var correct = parseInt(req.body.correct);
	var wrong = parseInt(req.body.wrong);

	identifier.tried += correct + wrong;
	identifier.correct += correct;
	identifier.wrong += wrong;

	Task.get(req.params.taskId, function (err, task) {
		if (err) {
			res.status(500);
			return res.json({error: err});
		} else {
			task.succeed();
			res.status(201);
			return res.json({});
		}
	});
});

router.put('/pause/:ip', Users.checkSuperuser);
router.put('/pause/:ip', function (req, res) {
	Satellite.pause[req.params.ip] = true;
	res.status(201);
	return res.json({});
});

router.delete('/pause/:ip', Users.checkSuperuser);
router.delete('/pause/:ip', function (req, res) {
	if (Satellite.pause[req.params.ip]) {
		delete Satellite.pause[req.params.ip];
	}
	res.status(204);
	return res.json({});
});

module.exports = router;
