/**
@constructor
*/
function Bookshelf(container, options) {
	container = $(container);
	setVendorCss(container, 'userSelect', 'none');
	container.css('overflow', 'hidden');
	if (!/^(absolute|fixed)$/.test(container.css('position'))) container.css('position', 'relative');
	
	var spacing = options['spacing'] || 1;
	var viewWidth = container.width();
	var viewHeight = container.height();
	var itemHeight = options['itemHeight'] || viewHeight;
	var itemWidth = options['itemWidth'] || itemHeight * (options['itemAspect'] || 1);
	var marginWidth = options['marginWidth'] || 0;
	var itemSpacing = Math.round(itemWidth * spacing);
	
	/**
	The bookshelf adds its own data to a Stream's segment.
	
	@constructor
	*/
	function BookshelfSegment(streamSegment, container) {
		this.element = $('<div>').css({
			width: (streamSegment.length * itemWidth) + 'px',
			height: itemHeight + 'px'
		});
		this.transform = new ElementPositionTransform(this.element);
		container.append(this.element);
	}
	
	BookshelfSegment.prototype.setPosition = function(position) {
		this.transform.setTopLeft(Math.round(position * DEVICE_PIXEL_RATIO) / DEVICE_PIXEL_RATIO, 0);
	}
	
	BookshelfSegment.prototype.initItem = function(streamItem, index) {
		this.element.append($(streamItem['element'])
			.css('position', 'absolute')
			.css('left', Math.round(itemSpacing * index) + 'px'));
	}
	
	BookshelfSegment.prototype.remove = function() {
		this.element.remove();
	}
	
	var view = {
		itemWidth: itemWidth,
		itemHeight: itemHeight,
		itemSpacing: itemSpacing,
		viewWidth: viewWidth,
		marginWidth: marginWidth,
		// Step to next item if the current is at least 90% visible.
		stepTollerance: 0.9,
		
		createSegment: function(segmentData, container) {
			return new BookshelfSegment(segmentData, container);
		},
		
		createPlaceholderSegment: function(container) {
			var segment = new BookshelfSegment({
				length: 1
			}, container);
			
			// TODO: Loading...
			segment.element.append($('<div>').css({
				width: itemWidth + 'px',
				height: itemHeight + 'px'
			}));
			return segment;
		}
	}
	var list = new SlidingList(container, options, view);

	this['remove'] = function() {
		list.remove();
		list = undefined;
	}
	
	this['refresh'] = function() {
		view.viewWidth = viewWidth = container.width();
		list.refresh();
	}
	
	this['step'] = function(dir) {
		list.stepItem(dir);
	}
	
	this['stepPage'] = function(dir) {
		list.stepPage(dir);
	}
}