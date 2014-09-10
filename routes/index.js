var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	var user = req.session ? req.session.user : undefined;
  	res.render('index', { username: (user ? user.id : undefined) });
});

module.exports = router;
