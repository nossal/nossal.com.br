var language = window.navigator.userLanguage || window.navigator.language;
var lang = language.split('-')[0];

function bounce(progress) {
	for(var a = 0, b = 1, result; 1; a += b, b /= 2) {
		if (progress >= (7 - 4 * a) / 11) {
			return -Math.pow((11 - 6 * a - 11 * progress) / 4, 2) + Math.pow(b, 2);
		}
	}
}
 
function makeEaseOut(delta) {
	return function(progress) {
		return 1 - delta(1 - progress);
	}
}
 
var bounceEaseOut = makeEaseOut(bounce);

function linear(progress) {
	return progress;
}


function animate(opts) {
	var start = new Date;
 
	var id = setInterval(function() {
		var timePassed = new Date - start;
		var progress = timePassed / opts.duration;
 
		if (progress > 1) progress = 1;
     
		var delta = opts.delta(progress);
		opts.step(delta);
     
		if (progress == 1) {
			clearInterval(id);
		}
	}, opts.delay || 10);
}

function move(element, delta, to, duration) {
	//var to = 500;

	animate({
		delay: 10,
		duration: duration || 1000, // 1 sec by default
		delta: delta,
		step: function(delta) {
			element.style.left = to * delta + "px";
		}
	});
}


var doc = document.documentElement, body = document.body;

var aas = document.querySelectorAll('.social a');
for (var i = 0; i < aas.length; i++) {
	aas[i].setAttribute('target', 'blank');
}

function getComputedUnit(element, attr) {
	return Number(getComputedStyle(element, '')[attr].match(/(\d*(\.\d*)?)px/)[1]);	
}

window.addEventListener('scroll', onScroll, false);

var h1 = document.getElementsByTagName('h1')[0];
var header = document.getElementsByTagName('header')[0];
var marginTop = getComputedUnit(h1, 'marginTop');

window.onresize = function() {
	if (h1.className === 'active')
		return;

	var bodySize = getComputedUnit(window.body, 'width');
	var h1Size = getComputedUnit(h1, 'width');
	
	var to = (bodySize / 2) - (h1Size / 2);
	h1.style.left = to + 'px';
	//move(h1, bounceEaseOut, to, 300);
}
window.onresize();


header.nextElementSibling.style.marginTop = absHeight(h1) + 'px';

function absHeight(element) {
	return getComputedUnit(h1, 'height') + getComputedUnit(h1, 'marginTop') * 2;
}

function onScroll( event ) {
	var top = (doc && doc.scrollTop || body && body.scrollTop || 0);
	
	if (top.scrollY > marginTop || top > marginTop) {
		if (h1.className === 'active')
			return;
			
		header.className = 'fixed';
		h1.className = 'active';
		h1.style.left = '0';
		
		header.style.height = absHeight(h1) + 'px';

	} else if (top.scrollY === 0 || top === 0) {
		header.className = '';
		header.style.height = 0;
		h1.className = '';
		
		window.onresize();
	}
}


var opts = document.querySelectorAll('ul.options li');
var opt = document.querySelector('ul.options');
var mask = document.querySelector('.mask');
mask.style.width = opts[0].offsetWidth + 'px';
mask.style.height = opts[0].offsetHeight + 'px';

var i = 0;
var adminTimer = setInterval(textAnim, 1200);

function textAnim() {
	mask.style.width = opts[i].offsetWidth + 'px';
	opt.style.top = '-'+ i * opts[0].offsetHeight + 'px';
	
	mask.parentNode.href = 'http://'+ opts[i].innerText + '/nossal';
	i = (i < opts.length -1) ? i+1 : 0;
}

mask.parentNode.onmouseover = function() {
	clearInterval(adminTimer);
}
mask.parentNode.onmouseout = function() {
	adminTimer = setInterval(textAnim, 1200);
}



String.prototype.compile = function(data) {
	var pattern, output, match;
	
	pattern = /(?:\{{2})([\w\[\]\.]+)(?:\}{2})/;
	output = this;

	
	while (match = pattern.exec(output)) {
		output = output.replace(match[0], '' + getValueFrom(match[1]));
	}

	function getValueFrom(varName) {
		var varPath = varName.split('.');
		var out = data;

		for (var key in varPath) {
			out = out[varPath[key]] || '';
		}

		return out;
	}
	
	return output;
}


var JSONP = {
	get: function(url, parameters, callback) {
		(function (url, parameters, callback) {
			var callbackName = parameters['callback'] = parameters['callback'] || 'JSONPcallback'+ new Date().getTime();
			if (typeof parameters['callback'] === 'object') {
				callbackName = parameters['callback'].name;
				delete parameters['callback'];
			}

			var script = document.createElement('script');
			script.id = 'fetcher'+ new Date().getTime();
			script.src = buildUrl(url, parameters);
		
			document.head.appendChild(script);

			function buildUrl(url, parameters) {
				var params = [];
		
				for (var key in parameters) {
					params.push(encodeURIComponent(key) +'='+ encodeURIComponent(parameters[key]));
				}
		
				return url + (url.indexOf("?")+1 ? "&" : "?") + params.join("&");
			}

			window[callbackName] = function(response) {
				callback(response);
				document.head.removeChild(document.getElementById(script.id));
				delete window[callbackName];
			};
		})(url, parameters, callback);
	}
};


(function() {
	var parameters = [], url;

	parameters['access_token'] = '23477739.bbaf38a.176e8703006f4d1680d5db4dac7c09bb';
	parameters['count'] = 14;
	
	url ='https://api.instagram.com/v1/users/23477739/media/recent';
	
	JSONP.get(url, parameters, function(response) {
		var images = response.data, html = [], template;
		
		template = '<li><img src="{{images.thumbnail.url}}" width="150" height="150" title="{{caption.text}}"></li>';
		html.push('<ul>');
		
		if (images instanceof Array) {
			for (var key in images) {
				html.push(template.compile(images[key]));
			}
		}
		html.push('</ul>');
		
		document.getElementById('instaphotos').innerHTML = html.join('');
	});

})();


(function() {
	var parameters, url;
	
	parameters = {
		method: 'flickr.people.getPublicPhotos',
		api_key: '6f38fb05774c34f1a33ee6f496d95404',
		user_id: decodeURIComponent('12989699%40N00'),
		per_page: 21,
		format: 'json',
		content_type: 1,
		callback: {name: 'jsonFlickrApi', dontPass: true}
	};

	url = 'http://api.flickr.com/services/rest/';
	
	JSONP.get(url, parameters, function(response) {
		var images = response.photos.photo, html = [], template;
		
		template = '<li><img src="{{url}}" width="150" height="150" title="{{caption}}"></li>';
		html.push('<ul>');
		
		if (images instanceof Array) {
			for (var key in images) {
				var obj = {};
				obj.caption = images[key].title;
				obj.url = 'http://farm{{farm}}.staticflickr.com/{{server}}/{{id}}_{{secret}}_q.jpg'.compile(images[key]);

				html.push(template.compile(obj));
			}
		}
		html.push('</ul>');
		
		document.getElementById('flickrphotos').innerHTML = html.join('');
	});
})();


(function(){
	var parameters, url;
	
	parameters = {
		access_token: 'CAABtKBQvWooBANH7owIp0ZClAA263QyIE9kHCj23tQAHMYrhXqZCuf6uAxkb4myXuCKyF7Qt8oPdL03VYz3YHqZCqRO8qy2MbsvxvEvlTPdPxylhgpZAZASNzs2ZBWZAVAcZBuN5ydFbVu7SmWhYOiU4tQBCDs3j20o634m0k8QPdgZDZD',
		method: 'GET'
	};

	url = 'https://graph.facebook.com/me/og.likes';
	
	JSONP.get(url, parameters, function(response) {
		var html = [], template, likes = response.data;
		
		template = '<li><img src="https://graph.facebook.com/{{application.id}}/picture" width="75" height="75" title="{{application.name}}"></li>';
		html.push('<ul>');
		
		for (var key in likes) {
			html.push(template.compile(likes[key]));
		}
		html.push('</ul>');
		
		document.getElementById('facebook').innerHTML = html.join('');
	});
})();