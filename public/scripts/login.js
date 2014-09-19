$(function() {
	$('#logger').click(function () {
		var username = $('input[name=user_id]').val();
		var password = $('input[name=password]').val();
		if (!username) {
			$('#loginMessage span').text('User ID is required.');	
		} else {
			$('#loginMessage span').addClass('loading');
			$('#loginMessage span').text('Loading...');
			$.ajax({
				url: "/users/login",
				type: 'POST',
				data: {
					username: username,
					password: password
				},
				dataType: 'json',
				timeout: 10000,
				error: function (jqXHR, textStatus, err) {
					$('#loginMessage span').removeClass('loading');
					$('#loginMessage span').text(JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
				},
				success: function (user) {
					$('#magnolia em').text(user.id);
					if (user.id != 'edge') {
						$('div.superuser').hide();
					} else {
						$('div.superuser').show();
					}
					$('div.hidden').hide();

					app.loadTask();
					app.loginEffect();
				}
			});
		}
	});
	$('#logout').click(function () {
		$.ajax({
			url: '/users/logout',
			type: 'POST',
			timeout: 10000,
			error: function (jqXHR, textStatus, err) {
				app.alert('Logout error: ' + JSON.parse(jqXHR.responseText).error + ' (Status: ' + err + ')');
			},
			success: function () {
				$('#loginMessage span').removeClass('loading');
				$('#loginMessage span').text('');
				$('#login input').val('');
				app.logoutEffect();
			}
		});
	});
	$("input[name=password]").keydown(function (e) { 
		var curKey = e.which; 
		if (curKey == 13) { 
			$("#logger").click();
			e.preventDefault();
		}
	}); 
});

