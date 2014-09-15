var exports = {};
module.exports = exports;

var rePage = /<td colspan="10" valign="baseline">Page \d+? of (\d+?)/i;

var tokenClassBegin = '<td class="datagrid"><a href="/elective2008/edu/pku/stu/elective/controller/supplement/goNested.do?';
var reName = /<span>(.*?)<\/span>/i;
var reThGr = /<td class="datagrid"><span style="width: 90">(.*?)<\/span><\/td>\s*<td class="datagrid" align="center"><span style="width: 30">(.*?)<\/span>/i;
var reTime = /<td class="datagrid"><span style="width: 200">(.*?)<\/span>/i;
var reCommand = /<td class="datagrid" align="center"><a (.)/i;
var reElect = /"\/elective2008\/edu\/pku\/stu\/elective\/controller\/supplement\/electSupplement.do\?index=(.*?)&amp;seq=(.*?)"/i;
var reRefresh = /javascript:refreshLimit\('.*?','.*?','.*?','(.*?)','(.*?)','.*?'\);/i;

exports.parseTotalPage = function (s) {
	var match = s.match(rePage);
	if (!match) {
		throw "Error when parsing pages."
	}
	return match[1];
};
exports.parseClass = function (s) {
	var ret = {};
	var match = s.match(reName);
	if (!match) {
		throw "Error when parsing class name."
	}
	ret.name = match[1];

	match = s.match(reThGr);
	if (!match) {
		throw "Error when parsing teacher name."
	}
	ret.teacher = match[1];

	match = s.match(reTime);
	if (!match) {
		throw "Error when parsing messages."
	}
	ret.msg = match[1];

	match = s.match(reCommand);
	var reIS;
	if (!match) {
		throw "Error when checking status."
	} else if (match[1] == 'h') { // elect
		reIS = reElect;
	} else {
		reIS = reRefresh;
	}

	match = s.match(reIS);
	if (!match) {
		throw "Error when extracting index and sequence number."
	}
	ret.index = match[1];
	ret.seq = match[2];

	return ret;
};
exports.parseList = function (s) {
	var res = [];
	var p = s.search(tokenClassBegin);
	while (p != -1) {
		res.push(exports.parseClass(s.substr(p)));
		s = s.substr(p + 1);
		p = s.search(tokenClassBegin);
		var e = s.search('datagrid-footer');
		if (p >= e) break;
	}
	return res;
}
