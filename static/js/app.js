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

var h1 = document.querySelector('h1');
var si = getComputedUnit(h1, 'marginTop');

window.onresize = function() {
	var bodySize = getComputedUnit(window.body, 'width');
	var h1Size = getComputedUnit(h1, 'width');
	
	var to = (bodySize / 2) - (h1Size / 2);
	h1.style.left = to + 'px';
	//move(h1, linear, to, 300);
}
window.onresize();

var lastMargin = 0;

function onScroll( event ) {
	var top = (doc && doc.scrollTop || body && body.scrollTop || 0);
	var cl = h1.parentNode.parentNode;
	
	if (top.scrollY > si || top > si) {
		cl.className = 'fixed';
		h1.className = 'active';

		h1.style.left = '0px';

	} else if (top.scrollY === 0 || top === 0) {
		cl.className = '';
		h1.className = '';

		window.onresize();
	}
	
	var actualMargin = getComputedUnit(h1, 'height') + 20 + si + 'px';
	if (actualMargin !== lastMargin) {
		(function(margin){
			lastMargin = margin;
			h1.parentNode.parentNode.nextElementSibling.style.marginTop = margin;
		})(actualMargin);
	}
}
onScroll();


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
