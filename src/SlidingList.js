/**
Base implementation of a sideways-scrolling list, using 'view' for customised presentation of the items.

@constructor
*/
function SlidingList(container, options, view) {
	var segments = [];
	var stream = options['stream'];
	var streamContext;
	var input;
	var frameId;
	var updatingTimeout;
	var animateStartTime;
	var animateDuration;
	var animatePositionsCallback;
	var throwDecelleration = options['drag'] || 0.002;
	var thrownVelocity;
	var stepTimeout;
	var stepDirection = (options['stepDirection'] < 0) ? -1 : 1;
	var stepInterval = 'stepInterval' in options ? options['stepInterval'] : 3000;
	var stepDuration = 'stepDuration' in options ? options['stepDuration'] : 1000;
	var grabbed;
	var preloadCount = ('preload' in options) ? options['preload'] : 20;
	var preloadDistance = view.itemSpacing * preloadCount;
	var removeDistance = view.itemSpacing * preloadCount * 3 / 2; // 50% more
	var startItem = options['startItem'];
	var focusedItem = null;
	var rounding = options['rounding'];
	var maxThrowVelocity = options['maxThrowVelocity'] || 4;
	var maxThrowItems = options['maxThrowItems'] || Infinity;
	
	/**
	A segment of items, containing additional data required for the SlidingList.
	
	@constructor
	@param {*} id  The segment id to create
	@param {number} index  Index to insert the segment
	*/
	function Segment(id, index) {
		// Immediately insert into our list of segments
		segments.splice(index, 0, this);
		
		this.id = id;
		this.streamItems = [];
		this.loaded = false;
		this.next = null;
		this.prev = null;
		this.width = 0;
		
		var segment = this;
		stream['loadSegment'](id, streamContext, function(streamSegment) {
			if (segment.removed) return;
			
			var length = streamSegment['length'];
			segment.streamSegment = streamSegment;
			segment.next = streamSegment['next'];
			segment.prev = streamSegment['prev'];
			
			// Prevent infinite loops from degenerate segments
			if (segment.next == segment && !length) delete segment.next;
			if (segment.prev == segment && !length) delete segment.prev;
			
			if (segment.viewSegment) segment.viewSegment.remove();
			segment.viewSegment = view.createSegment(streamSegment, container);
			
			segment.loaded = true;
			segment.width = length * view.itemSpacing;
			
			// Load stream items so images closest to current position load first
			if (index == segments.length - 1) {
				// Right end, load forward
				for (var i = 0; i < streamSegment.length; ++i) {
					segment.streamItems.push(stream['createItem'](segment.streamSegment, i, streamContext));
				}
			} else {
				// Left end, load backward
				for (var i = streamSegment.length - 1; i >= 0; --i) {
					segment.streamItems[i] = stream['createItem'](segment.streamSegment, i, streamContext);
				}
			}
			for (var i = 0; i < segment.streamItems.length; ++i) {
				segment.viewSegment.initItem(segment.streamItems[i], i);
			}
			segment.initPosition();
			startItem = null;
			updateLoadedSegments();
		});
		
		if (!this.loaded) {
			// Show a placeholder while loading
			this.width = view.itemSpacing;
			this.viewSegment = view.createPlaceholderSegment(container);
			this.initPosition();
		}
	}
	Segment.prototype.initPosition = function() {
		var first = segments[1];
		var last = segments[segments.length - 2];
		if (this.loaded && startItem !== null) {
			// Very first loaded segment.  Position so startItem is centered.
			if (typeof startItem == 'function') {
				var startTest = startItem;
				startItem = null;
				for (var i = 0; i < this.streamItems.length; ++i) {
					if (startTest(this.streamItems[i])) {
						startItem = i;
						break;
					}
				}
			}
			if (startItem >= 0 && startItem < this.streamItems.length) {
				// Always center start image
				this.x = (view.viewWidth - view.itemSpacing) / 2 - startItem * view.itemSpacing;
			} else {
				// No starting image.  Position first segment according to normal alignment.
				this.x = view.marginWidth;
			}
			this.startX = this.x;
			this.endX = this.x;
			startItem = null;
		} else if (this == segments[0] && first && first.loaded) {
			// Insert new first segment before current first.
			this.x = first.x - this.width;
			this.startX = first.startX - this.width;
			this.endX = first.endX - this.width;
		} else if (this == segments[segments.length - 1] && last && last.loaded) {
			// Insert new last segment after current last
			this.x = last.x + last.width;
			this.startX = last.startX + last.width;
			this.endX = last.endX + last.width;
		} else {
			// Not ready
			this.x = view.marginWidth;
			this.startX = view.marginWidth;
			this.endX = view.marginWidth;
		}
		
		this.updatePosition();
	}
	Segment.prototype.updatePosition = function() {
		this.viewSegment.setPosition(this.x);
		
		var focusedIndex = Math.floor((view.viewWidth / 2 - this.x) / view.itemSpacing);
		if (focusedIndex >= 0 && focusedIndex < this.streamItems.length
			&& this.streamItems[focusedIndex] != focusedItem) {
			focusedItem = this.streamItems[focusedIndex];
			if (options['onItemFocused']) {
				options['onItemFocused'](focusedItem, this.id, focusedIndex);
			}
		}
	}
	Segment.prototype.remove = function() {
		this.removed = true;
		if (this.viewSegment) this.viewSegment.remove();
		delete this.streamSegment;
		while (this.streamItems.length) {
			remove(this.streamItems.pop());
		}
	}
	
	function beginAnimation(distance, duration, positionCallback) {
		cancelAnimation();
		var endX = Math.round(segments[0].x + distance);
		for (var i = 0; i < segments.length; ++i) {
			var segment = segments[i];
			segment.startX = segment.x;
			segment.endX = endX;
			endX += segment.width;
		}
		updateLoadedSegments();
		animateStartTime = now();
		animateDuration = duration;
		animatePositionsCallback = positionCallback;
		frameId = requestFrame(animate);
	}
	
	function endAnimation() {
		for (var i = 0; i < segments.length; ++i) {
			var segment = segments[i];
			segment.x = segment.startX = segment.endX;
		}
		updateLoadedSegments();
		waitStep();
	}
	
	function cancelAnimation() {
		clearTimeout(stepTimeout);
		stepTimeout = undefined;
		cancelFrame(frameId);
		frameId = undefined;
	}
	
	function animate() {
		frameId = undefined;
		var t = now() - animateStartTime;
		if (t >= animateDuration) {
			endAnimation();
		} else {
			animatePositionsCallback(t);
			
			// Check for the ends of what we've loaded.
			var viewWidth = view.viewWidth;
			var leftStop = view.marginWidth;
			var rightStop = viewWidth - view.marginWidth;
			if (segments[0].x > leftStop) {
				// Hit leftmost end
				var x = leftStop;
				for (var i = 0; i < segments.length; ++i) {
					var segment = segments[i];
					segment.endX = x;
					x += segment.width;
				}
				endAnimation();
			} else if (segments[segments.length - 1].x + segments[segments.length - 1].width < rightStop) {
				// Hit rightmost end
				var x = rightStop;
				for (var i = segments.length - 1; i >= 0; --i) {
					var segment = segments[i];
					x -= segment.width;
					segment.endX = x;
				}
				endAnimation();
			} else {
				// Still free to move
				frameId = requestFrame(animate);
			}
		}
		updateSegmentPositions();	
	}
	
	function doThrow(velocity) {
		thrownVelocity = velocity;
		
		// Continue stepping in the direction they ask
		stepDirection = (thrownVelocity > 0) ? -1 : 1;
		
		// Unconstrained throw
		var distance = (0.5 * thrownVelocity * thrownVelocity) / ((thrownVelocity < 0) ? -throwDecelleration : throwDecelleration);
		
		if (rounding) {
			// Round distance to nearest item
			var p = segments[0].x - view.marginWidth + distance;
			distance += Math.round(p / view.itemSpacing) * view.itemSpacing - p;
		}
		
		// Prevent throwing more than maxThrowItems
		var itemX = (segments[0].x - view.marginWidth) / view.itemSpacing;
		if (distance < 0) {
			var itemOffset = Math.ceil(itemX) - itemX;
			var count = Math.ceil(itemOffset - distance / view.itemSpacing);
			if (count > maxThrowItems) {
				distance = (itemOffset - maxThrowItems) * view.itemSpacing;
			}
		} else {
			var itemOffset = itemX - Math.floor(itemX);
			var count = Math.ceil(itemOffset + distance / view.itemSpacing);
			if (count > maxThrowItems) {
				distance = (maxThrowItems - itemOffset) * view.itemSpacing;
			}
		}
		
		if (distance != 0) {
			// Readjust velocity and duration to match clamped/rounded distance
			thrownVelocity = Math.sqrt(Math.abs(distance * throwDecelleration * 2));
			if (distance < 0) thrownVelocity = -thrownVelocity;
			var duration = thrownVelocity / ((thrownVelocity < 0) ? -throwDecelleration : throwDecelleration);
			beginAnimation(distance, duration, updateThrowPositions);
		}
	}
	
	function updateThrowPositions(t) {
		var d = (thrownVelocity < 0) ? -throwDecelleration : throwDecelleration;
		for (var i = 0; i < segments.length; ++i) {
			var segment = segments[i];
			segment.x = segment.startX + thrownVelocity * t - 0.5 * d * t * t;
		}
	}
	
	function updateStepPositions(t) {
		t = smooth(t / animateDuration);
		for (var i = 0; i < segments.length; ++i) {
			var segment = segments[i];
			segment.x = segment.startX + t * (segment.endX - segment.startX);
		}
	}
	
	function waitStep() {
		if (frameId === undefined
			&& stepTimeout === undefined
			&& segments.length > 0
			&& !grabbed
			&& stepInterval != null) {
			// Not moving, start step in a bit
			stepTimeout = window.setTimeout(function() {
				stepTimeout = undefined;
				
				var count = 1;
				var step = (view.marginWidth - segments[0].x) % view.itemSpacing;
				var tollerance = 0.25 * view.itemWidth; // If this close to already-centered, go to next.
				if (stepDirection < 0) {
					while (step <= tollerance) step += view.itemSpacing;
					step += (count - 1) * view.itemSpacing;
				} else {
					while (step >= -tollerance) step -= view.itemSpacing;
					step -= (count - 1) * view.itemSpacing;
				}
				beginAnimation(step, stepDuration, updateStepPositions);
			}, stepInterval);
		}
	}
	
	// Move segments to their x position
	// Check for currently focused item
	function updateSegmentPositions() {
		for (var i = 0; i < segments.length; ++i) {
			segments[i].updatePosition();
		}
	}
	
	// Remove old segments, updateLoadedSegments other segments that will be visible duration the animation.
	function updateLoadedSegments() {
		if (updatingTimeout !== undefined) return;
		updatingTimeout = setTimeout(function() {
			updatingTimeout = undefined;
			if (!segments.length) return;
			
			var viewWidth = view.viewWidth;
			
			var minSegment = segments[0];
			var maxSegment = segments[segments.length - 1];
			
			// Remove segments too far away
			while (Math.max(minSegment.x, minSegment.endX) + minSegment.width < -removeDistance) {
				segments.shift().remove();
				minSegment = segments[0];
			}
			while (Math.min(maxSegment.x, maxSegment.endX) > viewWidth + removeDistance) {
				segments.pop().remove();
				maxSegment = segments[segments.length - 1];
			}
			
			// Load more segments
			if (Math.max(minSegment.x, minSegment.endX) > -preloadDistance
				&& minSegment.prev != null) {
				new Segment(minSegment.prev, 0);
			}
			if (Math.min(maxSegment.x, maxSegment.endX) + maxSegment.width < viewWidth + preloadDistance
				&& maxSegment.next != null) {
				new Segment(maxSegment.next, segments.length);
			}
		}, 1);
	}
	
	// Starts non-animated moving
	function startMove() {
		cancelAnimation();
		thrownVelocity = 0;
		for (var i = 0; i < segments.length; ++i) {
			var segment = segments[i];
			segment.startX = segment.endX = segment.x;
		}
	}
	
	// Moves relative to position saved by startMove
	function doMove(offset) {
		var viewWidth = view.viewWidth;
		var minSegment = segments[0];
		var minX = minSegment.startX;
		if (minSegment.prev != null) minX -= view.itemSpacing;
		var maxSegment = segments[segments.length - 1];
		var maxX = maxSegment.startX + maxSegment.width;
		if (maxSegment.next != null) maxX += view.itemSpacing;
		
		// Clamp the view
		var leftStop = view.marginWidth;
		var rightStop = viewWidth - view.marginWidth;
		offset = Math.max(offset, rightStop - maxX);
		offset = Math.min(offset, leftStop - minX);
		
		for (var i = 0; i < segments.length; ++i) {
			var segment = segments[i];
			segment.x = segment.endX = segment.startX + offset;
		}
		updateSegmentPositions();
		updateLoadedSegments();
	}
	
	this.remove = function() {
		clearTimeout(updatingTimeout);
		updatingTimeout = undefined;
		cancelAnimation();
		while (segments.length > 0) {
			remove(segments.pop());
		}
	}
	
	this.refresh = function() {
		if (frameId === undefined) {
			updateSegmentPositions();
			updateLoadedSegments();
		}
	}
	
	this.stepItem = function(step) {
		if (!grabbed
			&& segments.length > 0)
		{
			var dir = (step > 0) ? 1 : -1;
			var round = (step > 0) ? Math.floor : Math.ceil;
			// Align to the item on the side we're moving towards
			var side = (step > 0) ? (view.viewWidth + view.itemSpacing - view.itemWidth - view.marginWidth) : view.marginWidth;
			// Only scroll to the next item if they can see more than stepTollerance of the current item
			var tollerance = dir * view.stepTollerance;
			var target = round((segments[0].endX - side) / view.itemSpacing - step + tollerance) * view.itemSpacing + side;
			var distance = target - segments[0].x;
			var vel = Math.sqrt(Math.abs(2 * distance * throwDecelleration));
			if (distance < 0) vel = -vel;
			doThrow(vel);
		}
	}
	
	this.stepPage = function(step) {
		// Step a viewport width's worth of items
		// A page is the view width minus the margins
		var pageWidth = view.viewWidth - view.marginWidth * 2;
		this.stepItem(step * Math.max(1, Math.floor((view.viewWidth - view.marginWidth * 2) / view.itemSpacing)));
	}
	
	streamContext = {
		'itemWidth': view.itemFitWidth || view.itemWidth,
		'itemHeight': view.itemFitHeight || view.itemHeight,
		'itemSpacing': view.itemSpacing,
		'refresh': this.refresh
	}
	new Segment(options['startSegment'] || 0, 0);
	updateLoadedSegments();
	
	input = new PointerListener(container, {
		dragHorizontal: true,
		dragVertical: false,
		
		onPointerStart: function(event) {
			grabbed = segments.length > 1 || segments[0].loaded;
			if (grabbed) {
				startMove();
			}
		},
		onPointerMove: function(event) {
			if (grabbed) {
				doMove(event.pageX - event.startX);
			}
		},
		onPointerEnd: function(event) {
			if (grabbed) {
				doThrow(clamp(-maxThrowVelocity, event.velX, maxThrowVelocity));
				grabbed = false;
				waitStep();
			}
		},
		onWheel: function(event) {
			if (!grabbed
				&& segments.length > 0)
			{
				// Calculate distance, then 'throw' it that far
				var scroll = Math.abs(event.step) >= Math.abs(event.stepX) ? event.step : event.stepX;
				var distance = segments[0].endX - segments[0].x + scroll * view.itemSpacing;
				var vel = Math.sqrt(Math.abs(2 * distance * throwDecelleration));
				if (distance < 0) vel = -vel;
				doThrow(clamp(-maxThrowVelocity, vel, maxThrowVelocity));
			}
		},
		onHoverStart: function() {},
		onHoverEnd: function() {},
		onHoverMove: function(event) {
			// Restart timeout
			clearTimeout(stepTimeout);
			stepTimeout = undefined;
			waitStep();
		}
	});
	
	waitStep();
}
