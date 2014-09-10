var express = require('express');
var router = express.Router();
var settings = require('../settings.js');
var User = require('../models/user.js');

router.checkLoggedIn = function checkLoggedIn (req, res, next) {
	if (!req.session || !req.session.user) {
		res.status(403);
		return res.json({err: 'Not logged in.'});
	} else {
		next();
	}
}
router.checkNotLoggedIn = function checkNotLoggedIn (req, res, next) {
	if (req.session && req.session.user) {
		res.status(403);
		return res.json({err: 'Already logged in.'});
	} else {
		next();
	}
}
router.checkSuperuser = function checkSuperuser (req, res, next) {
	if (!req.session || !req.session.user) {
		res.status(403);
		return res.json({err: 'Not logged in.'});
	} else if (req.session.user) {
		if (req.session.user.id == 'edge') {
			next();
		} else {
			res.status(403);
			return res.json({err: 'Access denied.'});
		}
	}
};

router.post('/login', router.checkNotLoggedIn);
router.post('/login', function (req, res) {
	User.login(req.body.username, req.body.password, function (err, statusCode, user) {
		res.status(statusCode);
		if (err) {
			res.json({err: err});
		} else {
			req.session.user = user;
			return res.json(user);
		}
	});
})

router.post('/logout', router.checkLoggedIn);
router.post('/logout', function (req, res) {
	req.session.user = null;
	return res.json({});
});

module.exports = router;
