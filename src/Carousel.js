/**
@constructor
*/
function Carousel(container, options) {
	container = $(container);
	setVendorCss(container, 'userSelect', 'none');
	container.css('user-select', 'none');
	if (!/^(absolute|fixed)$/.test(container.css('position'))) container.css('position', 'relative');
	
	var spacing = options['spacing'] || 1.2;
	var tilt = options['tilt'] || 0;
	var perspective = 'perspective' in options ? options['perspective'] : 1;
	var viewWidth = container.width();
	var viewHeight = container.height();
	var itemHeight = options['itemHeight'] || viewHeight;
	var itemWidth = options['itemWidth'] || itemHeight * (options['itemAspect'] || 1);
	var itemSpacing = itemWidth * spacing;
	var fade = 'fade' in options ? options['fade'] : 0.1;
	
	var radius = spacing * viewWidth / 2;
	var virtualWidth = Math.PI * radius;
	
	if (!('startItem' in options)) {
		// By default, start so one item is centered and we don't reveal the previous segment to the left.
		options['startItem'] = Math.ceil(virtualWidth / 2 / itemSpacing);
	}
	
	/**
	The carousel adds its own data to a Stream's segment.
	
	@constructor
	*/
	function CarouselSegment(streamSegment, container) {
		this.container = container;
		this.items = [];
		this.visible = false;
	}
	
	CarouselSegment.prototype.setPosition = function(position) {
		if (!this.visible) {
			// Quick test whether Segment has become visible.
			this.visible = position < virtualWidth && position > -this.items.length * itemSpacing;
		}
		if (this.visible) {
			// Update items, record if none are visible
			var anyVisible;
			for (var i = 0; i < this.items.length; ++i) {
				var item = this.items[i];
				item.setPosition(position + itemSpacing * i);
				anyVisible = anyVisible || item.visible;
			}
			this.visible = anyVisible;
		}
	}
	
	CarouselSegment.prototype.initItem = function(streamItem, index) {
		this.items[index] = new CarouselItem(streamItem, this.container);
	}
	
	CarouselSegment.prototype.remove = function() {
		for (var i = 0; i < this.items.length; ++i) {
			this.items[i].element.remove();
		}
	}
	
	/**
	@constructor
	*/
	function CarouselItem(streamItem, SegmentContainer) {
		this.element = $(streamItem['element']).hide();
		this.streamItem = streamItem;
		this.visible = false;
		this.transform = new ElementScaleTransform(this.element, 0, 0, 0, 0);
		SegmentContainer.append(this.element);
	}
	
	CarouselItem.prototype.setPosition = function(position) {
		var p = (itemSpacing + position) / (itemSpacing + virtualWidth);
		var visible = p > 0 && p < 1;
		if (visible) {
			var angle = p * Math.PI;
			var z = 1 - Math.sin(angle);
			var scale = 1 / (1 + perspective * z);
			var x = viewWidth / 2 - scale * radius * Math.cos(angle);
			var y = viewHeight * tilt * z;
			
			var w = this.streamItem['width'];
			var h = this.streamItem['height'];
			this.transform.x = (itemWidth - w) / 2;
			this.transform.y = itemHeight - h;
			this.transform.width = w;
			this.transform.height = h;
			
			this.transform.setTopLeft(
				x - scale * itemWidth / 2,
				y + itemHeight - scale * itemHeight,
				1000 * (1 - z),
				scale, scale);
			var alpha = (p < fade) ? (p / fade)
				: (p > 1 - fade) ? ((1 - p) / fade)
				: 1;
			this.element.css('opacity', alpha.toFixed(3));
		}
		if (this.visible != visible) {
			this.visible = visible;
			this.element.toggle(visible);
		}
	}
	
	
	var list = new SlidingList(container, options, {
		// Size of item
		itemWidth: itemWidth,
		itemHeight: itemHeight,
		itemSpacing: itemSpacing,
		// Size of viewport.  For the carousel, this is the length of the arc that we place items.
		viewWidth: virtualWidth,
		// The left or rightmost item should be centered
		marginWidth: (virtualWidth - itemSpacing) / 2,
		// Step to next item that isn't the closest
		stepTollerance: 0.5,
		
		createSegment: function(streamSegment, container) {
			return new CarouselSegment(streamSegment, container);
		},
		
		createPlaceholderSegment: function(container) {
			// TODO: Loading...
			return new CarouselSegment(null, container);
		}
	});

	this['remove'] = function() {
		list.remove();
		list = undefined;
	}
	
	this['refresh'] = function() {
		list.refresh();
	}
	
	this['step'] = function(dir) {
		list.stepItem(dir);
	}
}