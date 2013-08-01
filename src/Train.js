/**
@constructor
*/
function Train(container, options) {
	container = $(container);
	setVendorCss(container, 'userSelect', 'none');
	container.css('user-select', 'none');
	container.css('overflow', 'hidden');
	if (!/^absolute|fixed$/.test(container.css('position'))) container.css('position', 'relative');
	
	var spacing = options['spacing'] || 1.1;
	var viewWidth = container.width();
	var viewHeight = container.height();
	var itemFitHeight = options['itemHeight'] || viewHeight;
	var itemFitWidth = options['itemWidth'] || itemFitHeight * (options['itemAspect'] || 0.8);
	var itemWidth = itemFitWidth * (options['unfocusedScale'] || 0.2);
	var itemHeight = itemFitHeight;
	var itemSpacing = itemWidth * spacing;
	var unfocusedOpacity = 'unfocusedOpacity' in options ? options['unfocusedOpacity'] : 0.5;
	var transitionOverlap = 'transitionOverlap' in options ? options['transitionOverlap'] : 0.15;
	var transitionFade = 'transitionFade' in options ? options['transitionFade'] : 0.2;
	var focusedPosition = 'focusedPosition' in options ? options['focusedPosition'] : 0.5;
	
	// The focused is assumed to be in the middle of the virtual area, so prepare an area that is sufficiently wide.
	var virtualWidth = viewWidth * (1 + 2 * Math.abs(focusedPosition - 0.5));
	
	if (!('startItem' in options)) {
		// By default, start so one item is centered and we don't reveal the previous segment to the left.
		options['startItem'] = Math.ceil(virtualWidth / 2 / itemSpacing);
	}
	if (!('maxThrowVelocity' in options)) {
		options['maxThrowVelocity'] = 1;
	}
	if (!('rounding' in options)) {
		options['rounding'] = true;
	}
	
	/**
	@constructor
	*/
	function TrainSegment(streamSegment, container) {
		this.container = container;
		this.items = [];
		this.visible = false;
	}
	
	TrainSegment.prototype.setPosition = function(position) {
		if (!this.visible) {
			// Quick test whether segment has become visible.
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
	
	TrainSegment.prototype.initItem = function(streamItem, index) {
		this.items[index] = new TrainItem(streamItem, this.container);
	}
	
	TrainSegment.prototype.remove = function() {
		for (var i = 0; i < this.items.length; ++i) {
			this.items[i].element.remove();
		}
	}
	
	/**
	@constructor
	*/
	function TrainItem(streamItem, segmentContainer) {
		this.element = $(streamItem['element']).hide();
		this.streamItem = streamItem;
		this.visible = false;
		this.transform = new ElementScaleTransform(this.element, 0, 0, 0, 0);
		segmentContainer.append(this.element);
	}
	
	TrainItem.prototype.setPosition = function(position) {
		var p = (itemSpacing + position) / (itemSpacing + virtualWidth);
		var visible = p > 0 && p < 1;
		if (visible) {
			var w = this.streamItem['width'];
			var h = this.streamItem['height'];
			this.transform.x = -w / 2;
			this.transform.y = 0;
			this.transform.width = w;
			this.transform.height = h;
			
			// How close this item is to the focused position
			var focus = smooth(Math.max(0, 1 - Math.abs(position - (virtualWidth - itemSpacing) / 2) / ((1 + transitionOverlap) * itemSpacing / 2)));
			var scale = (1 - focus) * (itemWidth / itemFitWidth) + focus;
			var height = scale * h;
			
			var x = position + itemSpacing / 2;
			if (focusedPosition < 0.5) x += (viewWidth - virtualWidth);
			this.transform.setTopLeft(
				x,
				(viewHeight - height) / 2,
				1000 * focus,
				scale, scale);
			var alphaT = focus / transitionFade;
			var alpha = Math.min(1, unfocusedOpacity * (1 - alphaT) + alphaT);
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
		// For quality, items need to be scaled to fit in full size
		itemFitWidth: itemFitWidth,
		itemFitHeight: itemFitHeight,
		// Size of viewport.
		viewWidth: virtualWidth,
		marginWidth: (virtualWidth - itemSpacing) / 2,
		// Step to next item that isn't the closest
		stepTollerance: 0.5,
		createSegment: function(streamSegment, container) {
			return new TrainSegment(streamSegment, container);
		},
		
		createPlaceholderSegment: function(container) {
			// TODO: Loading...
			return new TrainSegment(null, container);
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