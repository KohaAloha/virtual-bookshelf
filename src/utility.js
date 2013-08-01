// This file contains a lot of loose functions that don't live anywhere particular (yet)

var DEVICE_PIXEL_RATIO = (window['devicePixelRatio'] > 1) ? window['devicePixelRatio'] : 1;


function now() {
	return new Date().getTime();
}


var findVendorName_vendors = [ 'Webkit', 'Moz', 'O', 'Ms', 'Khtml', 'webkit', 'moz', 'o', 'ms', 'khtml' ];

/**
@param {...*} names
*/
function findVendorName(object, names) {
	if (object) {
		for (var ai = 1; ai < arguments.length; ++ai) {
			var name = arguments[ai];
			if (name in object) {
				return name;
			}
			name = name.slice(0, 1).toUpperCase() + name.slice(1);
			for (var vi = 0; vi < findVendorName_vendors.length; ++vi) {
				var vname = findVendorName_vendors[vi] + name;
				if (vname in object) {
					return vname;
				}
			}
		}
	}
	return undefined;
}


function setVendorCss(element, name, value) {
	element.each(function() {
		var vname = findVendorName(this.style, name);
		if (vname) this.style[vname] = value;
	});
}


/** @type { function((Function|undefined)):FrameId } */
var requestFrame = (function() {
	var request = findVendorName(window, 'requestAnimationFrame');
	return request
		? function(callback) { return window[request](callback) }
		: function(callback) { return window.setTimeout(callback, 1); };
})();

/** @type { function((FrameId|undefined)):undefined } */
var cancelFrame = (function() {
	var cancel = findVendorName(window, 'cancelAnimationFrame', 'cancelRequestAnimationFrame') || 'clearTimeout';
	return function(id) { window[cancel](id) };
})();


function fitInRectangle(inWidth, inHeight, aspectWidth, aspectHeight) {
	var w = inWidth;
	var h = inWidth * aspectHeight / aspectWidth;
	if (h > inHeight) {
		w = inHeight * aspectWidth / aspectHeight;
		h = inHeight;
	}
	return {
		width: Math.floor(w),
		height: Math.floor(h)
	}
}


function setLink(element, link) {
	if (typeof link == 'string') {
		element.attr('href', link);
	} else {
		element.css('cursor', 'pointer').click(link);
	}
}


function loadCss(url, onload) {
	if (document.createStyleSheet) {
		// IE likes to be different
		document.createStyleSheet(url);
		// createStyleSheet returns a styleSheet, but styleSheet.ownerNode.onload never fires.
		// If we just add a <link> then IE8 doesn't apply the css.  We're going to to both so IE works.
		// TODO: Is there a better way?
	}
	
	var link = $('<link>')
		.attr({
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': url
		});
	$('head').append(link);
	var stylesheet = link.get(0);
	stylesheet.onload = onload;
	stylesheet.onerror = onload;
}


function clamp(lower, value, upper) {
	return Math.max(lower, Math.min(value, upper));
}


// For a linearly changing value 0..1, produce a sin-curve value between 0..1
function smooth(t) {
	return (1 - Math.cos(t * Math.PI)) * 0.5;
}


function remove(object) {
	if (object && object['remove']) object['remove']();
}


/**
@constructor

A Lehmer RNG, taken from Wikipedia
*/
function Random(seed){
	this._s = seed;
}
Random.prototype.next = function() {
	this._s = (this._s * 279470273) % 4294967291;
	return this._s / 4294967291;
}
