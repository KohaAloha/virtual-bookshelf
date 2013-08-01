/**
@interface jQueryEvent
*/
function jQueryEvent() {
}

/**
@interface
*/
function jQueryObject() {
}
jQueryObject.prototype = {
	/**
	@param {!(jQueryObject|Element|string)} selector
	@param {!(jQueryObject|Element|string)=} context
	@return {jQueryObject}
	*/
	closest: function(selector, context) {},
	/**
	@param {!(Object|string)} objOrKey
	@param {(string|number)=} value
	@return {!(jQueryObject|string)}
	*/
	css: function(objOrKey, value) {},
	/**
	@param {!(Object|string)} objOrKey
	@param {(string|number)=} value
	@return {!(jQueryObject|string)}
	*/
	attr: function(objOrKey, value) {},
	/**
	@param {string} key
	@param {*} value
	@return {!(jQueryObject|string)}
	*/
	prop: function(key, value) {},
	/**
	@return {string}
	*/
	val: function() {},
	/**
	@param {string=} value
	@return {!(jQueryObject|string)}
	*/
	text: function(value) {},
	/**
	@param {string} name
	@param {function(this:Element,jQueryEvent)} handler
	*/
	bind: function(name, handler) {},
	/**
	@param {string} name
	@param {function(this:Element,jQueryEvent)} handler
	*/
	unbind: function(name, handler) {},
	/**
	@param {function(this:Element,jQueryEvent)} handler
	@return {!jQueryObject}
	*/
	click: function(handler) {},
	/**
	@param {string} cls
	@return {!jQueryObject}
	*/
	addClass: function(cls) {},
	/**
	@param {string} cls
	@return {boolean}
	*/
	hasClass: function(cls) {},
	/**
	@param {string} cls
	@return {!jQueryObject}
	*/
	removeClass: function(cls) {},
	/**
	@param {string} cls
	@param {boolean=} toggle
	@return {!jQueryObject}
	*/
	toggleClass: function(cls, toggle) {},
	/**
	@return {!jQueryObject}
	*/
	show: function() {},
	/**
	@return {!jQueryObject}
	*/
	hide: function() {},
	/**
	@param {boolean=} showOrHide
	@return {!jQueryObject}
	*/
	toggle: function(showOrHide) {},
	/**
	@param {function(this:Element, number, Element)} callback
	@return {!jQueryObject}
	*/
	each: function(callback) {},
	/**
	@param {function(this:Element, number, Element)} callback
	@return {!jQueryObject}
	*/
	map: function(callback) {},
	/**
	@return {!jQueryObject}
	*/
	clone: function() {},
	/**
	@param {(jQueryObject|Element|Text|string)} element
	@return {!jQueryObject}
	*/
	append: function(element) {},
	/**
	@param {(jQueryObject|Element|Text|string)} element
	@return {!jQueryObject}
	*/
	prepend: function(element) {},
	/**
	@param {(jQueryObject|Element|Text|string)} element
	@param {...(jQueryObject|Element|Text|string)} elements
	@return {!jQueryObject}
	*/
	before: function(element, elements) {},
	/**
	@param {number} index
	@return {!Element}
	*/
	get: function(index) {},
	/**
	@param {number} start
	@param {number=} end
	@return {!jQueryObject}
	*/
	slice: function(start, end) {},
	/**
	@param {!(jQueryObject|Element|string)} selector
	@return {!jQueryObject}
	*/
	find: function(selector) {},
	/**
	@param {string=} selector
	@return {!jQueryObject}
	*/
	parent: function(selector) {},
	/**
	@param {string=} selector
	@return {!jQueryObject}
	*/
	parents: function(selector) {},
	/**
	@param {string=} selector
	@return {!jQueryObject}
	*/
	children: function(selector) {},
	/**
	@param {string=} selector
	*/
	remove: function(selector) {},
	/**
	@param {number=} value
	@return {!(jQueryObject|number)}
	*/
	width: function(value) {},
	/**
	@param {number=} value
	@return {!(jQueryObject|number)}
	*/
	height: function(value) {},
	/**
	@param {number=} value
	@return {!(jQueryObject|number)}
	*/
	outerWidth: function(value) {},
	/**
	@param {number=} value
	@return {!(jQueryObject|number)}
	*/
	outerHeight: function(value) {},
	/**
	@param {Function} inOrInOut
	@param {Function=} out
	@return {!jQueryObject}
	*/
	hover: function(inOrInOut, out) {}
}


/**
@param {!(string|Element|Window)} selector
@return {!jQueryObject}
*/
function $(selector) {}
/**
@param {function()} onready
*/
$.ready = function(onready) {}
/**
@param {!Array} array
@param {*} value
@param {number=} fromIndex
@return {number}
*/
$.inArray = function(array, value, fromIndex) {}
$.browser = {
	// jQuery detects other browsers, but we only want to sniff IE8.
	msie: true,
	version: ''
}
/**
@param {string} url
@param {(Object|Function)=} data
@param {function(*)=} callback
*/
$.getJSON = function(url, data, callback) {}
/**
@param {!Object} intoObject
@param {...!Object} fromObjects
*/
$.extend = function(intoObject, fromObjects) {}


var console = {
	/**
	@param {...*} varargs
	*/
	log: function(varargs) {}
}


/**
@interface
*/
function Stream() {};
Stream.prototype['loadSegment'] = function(id, context, onload) {};
Stream.prototype['createItem'] = function(segment, index, context, container) {};


/**
@interface

Used for the type id with requestFrame, cancelFrame
*/
function FrameId() {}
