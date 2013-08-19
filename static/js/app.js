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
var easeOut = makeEaseOut(linear);

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
var nextToHeader = header.nextElementSibling;
var start = document.querySelectorAll('a.start')[0];
var who = document.getElementById('who');

var sections = document.getElementsByTagName('section');
var pages = [];
for (var key in sections) {
	var section = sections[key];
	pages[section.offsetTop] = section.id;
}

window.onresize = function() {
	if (h1.className === 'active')
		return;

	var bodySize = getComputedUnit(window.body, 'width');
	var h1Size = getComputedUnit(h1, 'width');
	
	var to = (bodySize / 2) - (h1Size / 2);
	h1.style.left = to + 'px';
	//move(h1, bounceEaseOut, to, 300);
	
	nextToHeader.style.height = window.innerHeight - absHeight(h1)*1.5 + 'px';
	nextToHeader.style.marginTop = absHeight(h1) + 'px';
}
window.onresize();

function absHeight(element) {
	return getComputedUnit(h1, 'height') + getComputedUnit(h1, 'marginTop') * 2;
}

function onScroll(event) {
	var top = (doc && doc.scrollTop || body && body.scrollTop || 0);

	console.info(top);
	if (top in pages)
		console.info('page '+ top);

	if (top.scrollY > marginTop || top > marginTop) {
		if (h1.className === 'active')
			return;
			
		header.className = 'fixed';
		h1.className = 'active';
		h1.style.left = 0;
		
		start.style.display = 'none';
		
		header.style.height = absHeight(h1) + 'px';

	} else if (top.scrollY === 0 || top === 0) {
		header.className = '';
		header.style.height = 0;
		h1.className = '';

		start.style.display = 'block';
		
		window.onresize();
	}
	


	
}


function scrollToElement(element) {
	var to = element.offsetTop - 55;
	var start = new Date;
 	console.info(to)
	var id = setInterval(function() {
		var timePassed = new Date - start;
		var progress = timePassed*3 / to;
 	   
		if (progress > 1) progress = 1;
     
		var delta = easeOut(progress);
		
		window.scrollTo(0, delta*to);
     
		if (progress == 1) {
			clearInterval(id);
		}
	}, 5);
}

start.onclick = function (e) {
	e.preventDefault();
	scrollToElement(who);
};


/*
var opts = document.querySelectorAll('ul.options li');
var opt = document.querySelector('ul.options');
var mask = document.querySelector('.mask');
mask.style.width = opts[0].offsetWidth + 'px';
mask.style.height = opts[0].offsetHeight + 'px'; //.getComputedUnit(opts[0], 'lineHeight') + 'px';

var i = 0;
//var aminTimer = setInterval(textAnim, 1200);

function textAnim() {
	mask.style.width = opts[i].offsetWidth + 'px';
	opt.style.top = '-'+ i * opts[0].offsetHeight + 'px';
	
	mask.parentNode.href = '//'+ opts[i].innerText + '/nossal';
	i = (i < opts.length -1) ? i+1 : 0;
}

mask.parentNode.onmouseover = function() {
	clearInterval(aminTimer);
}
mask.parentNode.onmouseout = function() {
	adinTimer = setInterval(textAnim, 1200);
}
*/


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
			var callbackName = parameters['callback'] = parameters['callback'] || 'JSONPCallback'+ new Date().getTime();
			if (typeof parameters['callback'] === 'object') {
				callbackName = parameters['callback'].name;
				delete parameters['callback'];
			}

			var script = document.createElement('script');
			script.id = 'fetcher'+ new Date().getTime();
			script.src = buildUrl(url, parameters);
			script.async = 'async';
			document.head.appendChild(script);

			function buildUrl(url, parameters) {
				var params = [];
		
				for (var key in parameters) {
					params.push(encodeURIComponent(key) +'='+ encodeURIComponent(parameters[key]));
				}
		
				return url + (url.indexOf('?')+1 ? '&' : '?') + params.join('&');
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

	url = '//api.flickr.com/services/rest/';
	
	JSONP.get(url, parameters, function(response) {
		var images = response.photos.photo, html = [], template;
		
		template = '<li><img src="{{url}}" width="150" height="150" title="{{caption}}"></li>';
		html.push('<ul>');
		
		if (images instanceof Array) {
			for (var key in images) {
				var obj = {};
				obj.caption = images[key].title;
				obj.url = '//farm{{farm}}.staticflickr.com/{{server}}/{{id}}_{{secret}}_q.jpg'.compile(images[key]);

				html.push(template.compile(obj));
			}
		}
		html.push('</ul>');
		
		document.getElementById('flickrphotos').innerHTML = html.join('');
	});
})();

(function() {
	JSONP.get('/api/mylasttweet', [], function(tweet) {

		tweet.date = new Date(tweet.created_at).toLocaleString();
		//tweet.text = 'asd sd asdasda sdas dasdasdas adsdas asd sdasd asd asdasd asdasd asda sdasdasdasd asd asdas das asasd sadsdasd asdas das adasda asd asdasda';

		template = '<div class="bird"> \
						<span class="symbol">twitterbird</span> \
					</div> \
					<div class="text"> \
						<a href="//twitter.com/nossal"> \
							<span>@nossal</span><p id="tweettext">{{text}}</p> \
						</a> \
					</div> \
					<div class="status"><span>{{client}}</span><span>{{date}}</span></div>';
		
		document.getElementById('tweetwidget').innerHTML = template.compile(tweet);
	});
})();

(function(){
	var parameters, url;
	
	parameters = {
		access_token: 'CAABtKBQvWooBAN9zxaM006wu6J1uDrcAkLpcFDZBiUAODZCVFOUgnZAdyv6Srxo4w9wQ8CwEfhZAgm2NhD83XLlrLrFe6iDXV3g9gKm9r1HGZBLXVoEMIVCh4sZA5sse2kKE5txpk9gU1h61P2HQnpUlZCZCkYN2ns3nxILSZC0d0RgZDZD',
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
});