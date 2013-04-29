/**
@constructor
*/
function JSONStream(baseUrl, options) {
	options = options || {};
	
	this._baseUrl = baseUrl;
	this._options = {
		itemType: options['itemType'] || SimpleItem
	};
}


JSONStream.prototype['loadSegment'] = function(id, context, onload) {
	$.getJSON(this._baseUrl + id, function(data) {
		onload({
			'id': id,
			'prev': data['prev'],
			'next': data['next'],
			'length': data['items']['length'],
			_items: data['items']
		});
	});
}

				
JSONStream.prototype['createItem'] = function(segment, index, context) {
	return new this._options.itemType(segment._items[index], context);
}
