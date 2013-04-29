/**

Makes a stream from an array of items.

Each item in the `array` is an object containing these attributes:
	- `image` The image URL
	- `link` (optional) <a> element href.
	- `target` (optional) <a> element target.  '_blank' will open the link in a new window.
	- `title` (optional) <img> element target.

@constructor
@implements Stream
@param {Array} array

*/
function ArrayStream(array, options) {
	options = options || {};
	
	this._array = array;
	this._options = {
		looping: !('looping' in options) || options['looping'],
		itemType: options['itemType'] || SimpleItem
	};
}


ArrayStream.prototype['loadSegment'] = function(id, context, onload) {
	var loop = this._options.looping ? id : undefined;
	onload({
		'id': id,
		'prev': loop,
		'next': loop,
		'length': this._array.length
	});
}


ArrayStream.prototype['createItem'] = function(segment, index, context) {
	return new this._options.itemType(this._array[index], context);
}
