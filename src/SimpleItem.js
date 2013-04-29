/**
@constructor
*/
function SimpleItem(data, context) {
	// Create container for the item
	var a = $('<a>')
		.attr('href', data['link'])
		.attr('target', data['target'])
		.attr('title', data['title'])
		.css('display', 'inline-block');
		
	this['element'] = a;
	// Before the item is loaded, the container has zero size
	this['width'] = 0;
	this['height'] = 0;
	this['data'] = data;
	
	var self = this;

	// Load the image asynchronously
	var image = new Image();
	function ready() {
		image.onload = null;
		image.onerror = null;
		
		// Preserving the item's aspect ratio, make the item fill the box
		self['width'] = context['itemWidth'];
		self['height'] = Math.round(this.height * context['itemWidth'] / this.width);
		if (self['height'] > context['itemHeight']) {
			self['width'] = Math.round(this.width * context['itemHeight'] / this.height);
			self['height'] = context['itemHeight'];
		}
		a.width(self['width'])
			.height(self['height'])
			.append($(image).css({
				// For a Carousel display, the image must fill its container, so that non-3D-accelerated browsers can scale it by resizing the <a>.
				'width': '100%',
				'height': '100%',
				// Remove border for linked image
				'border': 'none'
			}));;
		context.refresh();
	}
	image.onload = ready;
	image.onerror = ready;
	image.src = data['image'];
}
