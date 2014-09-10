var app = app || {};

$(function () {
	app.tasks.reset([
		{
			_id: '123456',
			user_id: '1200012716',
			status: 'running',
			attempts: 1721,
			errors: 15,
			last_error: 'Request timeout',
			classes: ['实用英语词汇学', '实用英语词汇学', '实用英语词汇学']
		},
		{
			_id: '123457',
			user_id: '1200012787',
			status: 'paused',
			attempts: 522,
			errors: 3,
			last_error: 'Request timeout',
			classes: ['高尔夫球', '高尔夫球']
		},
		{
			_id: '12345e',
			user_id: '1200012747',
			status: 'succeeded',
			attempts: 1320,
			errors: 0,
			last_error: null,
			classes: ['实用英语词汇学']
		}
	]);
	$('#inquiry').click(function() {
		app.classes.reset([
			{
				name: '概率统计（A）',
				teacher: '李东风(副教授)',
				msg: '1~16周 双周周二1~2节 二教207<br>1~16周 每周周四3~4节 二教207<br>考试时间：20150113上午；',
				seq: '1',
				index: '1'
			},
			{
				name: '概率统计（A）',
				teacher: '陈立杰(教授)',
				msg: '1~16周 双周周二1~2节 二教207<br>1~16周 每周周四3~4节 二教207<br>考试时间：20150113上午；',
				seq: '2',
				index: '2'
			},
			{
				name: '实用英语词汇学',
				teacher: '张华(教授)',
				msg: '1~16周 每周周二3~4节 二教209<br>考试时间：20150113上午；',
				seq: '3',
				index: '3'
			},
			{
				name: '实用英语词汇学',
				teacher: '张华(教授)',
				msg: '1~16周 每周周三7~8节 文史110(备注：周二、周四与普通班合上)<br>考试时间：20150113上午；',
				seq: '4',
				index: '4'
			},
			{
				name: '泛函分析',
				teacher: '李伟固(教授)',
				msg: '1~16周 双周周二1~2节 二教207<br>1~16周 每周周四3~4节 二教207<br>考试时间：20150113上午；',
				seq: '5',
				index: '5'
			}
		]);
	});
});