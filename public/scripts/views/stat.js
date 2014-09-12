var app = app || {};

var updateStatInterval = 60000;

var parseNumToKMB = function (num) {
	if (num < 1000) return num.toString();
	else if (num < 9950) return (Math.round(num / 100) / 10).toFixed(1) + 'K';
	else if (num < 999500) return Math.round(num / 1000) + 'K';
	else if (num < 9950000) return (Math.round(num / 100000) / 10).toFixed(1) + 'M';
	else if (num < 999500000) return Math.round(num / 1000000) + 'M';
	else return (Math.round(num / 100000000) / 10).toFixed(1) + 'G';
}

app.fillIdentifyStat = function (tried, correct) {
	var acc;
	if (tried == 0) acc = 'N/A';
	else {
		acc = (correct / tried * 100).toFixed(1) + '%';
		if (acc == '100.0%') acc = '100%';
	}
	$('#blkAccuracy').text(acc);
	$('#blkIdentified').text(parseNumToKMB(tried));
};

app.updateIdentifyStat = function () {
	$.ajax({
		url: '/stat',
		type: 'GET',
		dataType: 'json',
		timeout: 10000,
		context: this,
		error: function () {
			app.alert("Error occured when retrieving identifier's statistic data.");
		},
		success: function (stat) {
			app.fillIdentifyStat(stat.tried, stat.correct);
		}
	});
};

$(function () {
	setInterval(app.updateIdentifyStat, updateStatInterval);

	$('#cmdResetStat').click(function() {
		app.alert('Loading...', true);
		$.ajax({
			url: '/stat',
			type: 'PUT',
			dataType: 'json',
			timeout: 10000,
			context: this,
			error: function () {
				app.alert("Error occured when reseting identifier's statistic data.");
			},
			success: function (stat) {
				app.hideAlert(500);
				app.fillIdentifyStat(0, 0);
			}
		});
	});

	$('#cmdSetRetryConfirm').hide();
	$('#cmdSetRetryCancel').hide();
	$('#cmdSetRetry').click(function () {
		$('#cmdSetRetry').hide();
		$('#cmdSetRetryConfirm').show();
		$('#cmdSetRetryCancel').show();
		$('#blkRetryTime').hide();
		$('#inputRetryTime').val($('#blkRetryTime').text()).show();
	});
	$('#cmdSetRetryConfirm').click(function () {
		var newInterval = $('#inputRetryTime').val();
		if (!$.isNumeric(newInterval) || newInterval < 100 || newInterval >= 10000) {
			app.alert('Retry interval must be a number between 100 and 9999.');
		} else {
			newInterval = Math.round(newInterval);
			app.alert('Loading...', true);
			$.ajax({
				url: '/retryInterval',
				type: 'PUT',
				data: {
					val: newInterval
				},
				dataType: 'json',
				timeout: 10000,
				context: this,
				error: function (jqXHR, textStatus, err) {
					if (jqXHR.status == 500) {
						app.alert('Set error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
					} else {
						app.alert('Set error: ' + err);
					}
				},
				success: function () {
					app.loadTask();
					$('#cmdSetRetry').show();
					$('#cmdSetRetryConfirm').hide();
					$('#cmdSetRetryCancel').hide();
					$('#blkRetryTime').text(newInterval);
					$('#blkRetryTime').show();
					$('#inputRetryTime').hide();
				}
			});
		}
	});
	$('#cmdSetRetryCancel').click(function () {
		$('#cmdSetRetry').show();
		$('#cmdSetRetryConfirm').hide();
		$('#cmdSetRetryCancel').hide();
		$('#blkRetryTime').show();
		$('#inputRetryTime').hide();
	});
});