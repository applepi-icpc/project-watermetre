var logger = require('../utility/login.js');
var settings = require('../settings');
var crypto = require('crypto');

function User(id, jsessionid) {
	this.id = id;
	if (jsessionid) this.jsessionid = jsessionid;
}
module.exports = User;

// callback(err, statusCode, user)
User.login = function login(username, password, callback) {
	if (username == 'edge') { 
		// superuser login
		var sha1 = crypto.createHash('sha1');
		password = sha1.update(password).digest('base64');

		if (password == settings.edgePassword) {
			return callback(null, 201, new User('edge'));
		} else {
			return callback('Wrong password.', 403);
		}
	} else {
		// other users login
		logger.login(username, password, function (err, jsessionid) {
			if (err) {
				if (err == '密码错误') {
					return callback('Wrong password.', 403);
				} else {
					return callback(err, 500);
				}
			} else {
				return callback(null, 201, new User(username, jsessionid));
			}
		});
	}
};