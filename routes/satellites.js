var express = require('express');
var router = express.Router();
var identifier = require('../utility/identify.js');

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
			latency: Satellite.latency[satellite],
			paused: Satellite.pause[satellite] ? true : false
		});
	});
	res.status(200);
	return res.json(ret);
});

router.post('/sendFailed', function (req, res) {
	identifier.tried += req.body.correct + req.body.error;
	identifier.correct += req.body.correct;
	identifier.error += req.body.error;

	res.status(201);
	return res.json({});
});

router.post('/sendOK/:taskId', function (req, res) {
	identifier.tried += req.body.correct + req.body.error;
	identifier.correct += req.body.correct;
	identifier.error += req.body.error;

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
	delete Satellite.pause[req.params.ip];
	res.status(204);
	return res.json({});
});

module.exports = router;