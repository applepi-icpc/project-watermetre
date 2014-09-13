var export = {};
module.exports = export;

var expireTime = 20000; // ms
var timeout = 10000; // ms

export.lastHeartbeat = {}; // stores ip => lastHeartbeat (Unix time)
export.queue = []; // stores ip

// callback(err, status)
export.sendRequest = function (jsessionid, seq, index, callback) {
	var satellite;
	var now = new Date().getTime();
	while (export.queue.length > 0) {
		satellite = export.queue.shift();
		if (now - lastHeartbeat <= expireTime) break;
		else satellite = undefined;
	}
	if (!satellite) {
		return callback('No avaliable satellites.');
	}
	export.queue.push(satellite);

	var req = http.request({
		hostname: satellite,
		path: '/',
		method: 'POST'
	}, function (response) {
		var buffers = [];
		var len = 0;
		response.on('data', function (chunk) {
			buffers.push(chunk);
			len += chunk.length;
		});
		response.on('end', function () {
			var res = Buffer.concat(buffers, len).toString('utf8');
			if (res == 'OK') {
				return callback(null, 'OK');
			} else if (res == 'Full') {
				return callback(null, 'Full');
			} else {
				return callback(res);
			}
		});
	});
	req.on('socket', function (socket) {
		socket.setTimeout(timeout);
		socket.on('timeout', function () {
			req.abort();
		});
	});
	req.on('error', function (err) {
		return callback(err);
	});
	req.write(JSON.stringify({
		jsessionid: jsessionid,
		seq: seq,
		index, index
	}), 'utf8');
	req.end();
}