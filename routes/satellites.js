var express = require('express');
var router = express.Router();
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
	res.status(200);
	return res.json(Satellite.lastHeartbeat);
});

module.exports = router;