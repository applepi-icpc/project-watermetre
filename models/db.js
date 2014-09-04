var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

var mongodb = new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT, {}), { safe: true });

module.exports = mongodb;

mongodb.open(function(err, db) {
	if (err) {
		console.log('Failed to open MongoDB connection.');
		throw err;
	}
	console.log('MongoDB connected.');
});
