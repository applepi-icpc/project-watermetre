var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

var mongodb = new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT, {}), { safe: true });

module.exports = mongodb;

mongodb.initialize = function (callback) {
	this.open(function(err, db) {
		if (err) {
			return callback(err);
		} else {
			return callback();
		}
	});
};