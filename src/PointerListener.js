var hasTouch = 'ontouchstart' in window;
var touchDragTollerance = 6;
var touchVelInterval = 100;
var touchIdleInterval = 500;
var touchEvents = 'touchstart touchmove touchend touchcancel';
var mouseDragTollerance = 6;
var mouseEvents = 'mousedown mouseenter mouseleave mousemove contextmenu mousewheel DOMMouseScroll selectstart';
var mouseSetCaptureEvents = 'mouseup dragstart losecapture';
var mouseWindowCaptureEvents = 'mouseup dragstart mousemove';
var targetSuppressedEvents = 'click';


/**
Tracks an element's touch/mouse events and translates them into more robust, simpler events with velocity.  This is constrained to reporting a single point.

If dragHorizontal or dragVertical are true, then touch scrolling will be preventing when moving in that direction.

For onWheel events, the delta values are roughly equivalent to number of lines.  'step' values are our best-guess at the number of notches stepped on the mouse.

@constructor
@param {!jQueryObject} element
@param {!{
	dragHorizontal: (boolean|undefined),
	dragVertical: (boolean|undefined),
	onPointerStart: function(!{ pageX: number, pageY: number, startX: number, startY: number, velX: number, velY: number }): undefined,
	onPointerMove: function(!{ pageX: number, pageY: number, startX: number, startY: number, velX: number, velY: number }): undefined,
	onPointerEnd: function(!{ pageX: number, pageY: number, startX: number, startY: number, velX: number, velY: number }): undefined,
	onWheel: function(!{ delta: number, deltaX: number, deltaY: number, step: number, stepX: number, stepY }): undefined,
	onHoverStart: function(!{ pageX: number, pageY: number }): undefined,
	onHoverMove: function(!{ pageX: number, pageY: number }): undefined,
	onHoverEnd: function(!{ pageX: number, pageY: number }): undefined
}} options
*/
var PointerListener = function(element, options) {
	// IE/Firefox use setCapture and releaseCapture.  If not these we will hook `window` later.
	var hasSetCapture = element.get(0).setCapture && element.get(0).releaseCapture;
	
	var pointerId; // 'mouse' when mouse is pressed, else touch id
	var dragging; // We are capturing the touch, scrolling is prevented.
	var capturing; // Globally capturing events
	var captureTarget; // If hasSetCapture, the element they originally clicked on
	var startPos; // { x, y, time } pointer started
	var recentPos; // Array of { x, y, time } of all points within the last touchIdleInterval, for velocity calculation.
	var velX;
	var velY;
	var hoverPos;
	var unbindSuppressedEvents = null;
	var eventHandlers = {};
	var mouseWheelStep = Infinity;
	
	function dispatchPointerEvent(handler) {
		handler({
			pageX: recentPos[recentPos.length - 1].x,
			pageY: recentPos[recentPos.length - 1].y,
			startX: startPos.x,
			startY: startPos.y,
			velX: velX,
			velY: velY
		});
	}
	
	function startCapture() {
		if (!hasTouch && !capturing) {
			capturing = true;
			if (hasSetCapture && !captureTarget) {
				captureTarget = element;
				captureTarget.bind(mouseSetCaptureEvents, handleEvent);
				captureTarget.get(0).setCapture(false);
			}
			// For other browsers, the window will report all mouse movements
			$(window).bind(mouseWindowCaptureEvents, handleEvent);
		}
	}
	
	function endCapture() {
		if (capturing) {
			capturing = false;
			if (captureTarget) {
				captureTarget.unbind(mouseSetCaptureEvents, handleEvent);
				captureTarget.get(0).releaseCapture();
				captureTarget = undefined;
			}
			$(window).unbind(mouseWindowCaptureEvents, handleEvent);
		}
	}
	
	function startPoint(id, pointer) {
		pointerId = id;
		startPos = {
			x: pointer.pageX,
			y: pointer.pageY,
			time: now()
		};
		recentPos = [ startPos ];
		velX = 0;
		velY = 0;
		startCapture();
	}
	
	function updatePoint(pointer) {
		var prevPos = recentPos[recentPos.length - 1];
		var curPos = {
			x: pointer.pageX,
			y: pointer.pageY,
			time: now()
		};
		
		// Update recent list.  We prefer to calculate velocity based on a touch a little
		// over touchVelInterval ago, but not too long.
		recentPos.push(curPos);
		while (recentPos.length > 2
			&& curPos.time - recentPos[0].time > touchVelInterval) {
			recentPos.shift();
		}
		var velPos = recentPos[0];
		if (curPos.time - velPos.time >= touchIdleInterval) {
			// Previous touch was too long ago.
			recentPos.shift();
			velX = 0;
			velY = 0;
		} else {
			// Motioning.  Update velocity every touchVelInterval.
			var dt = curPos.time - velPos.time;
			if (dt > 0) {
				velX = (curPos.x - velPos.x) / dt;
				velY = (curPos.y - velPos.y) / dt;
			}
		}
		
		return curPos.x != prevPos.x || curPos.y != prevPos.y;
	}
	
	function movePoint(pointer, event, dragTollerance) {
		if (updatePoint(pointer)) {
			var curPos = recentPos[recentPos.length - 1];
			
			if (!dragging) {
				// Check whether we've starting dragging or allowing the iPad to scroll
				var movingHorizontally = (Math.abs(curPos.x - startPos.x) >= dragTollerance);
				var movingVertically = (Math.abs(curPos.y - startPos.y) >= dragTollerance);
				if ((options.dragHorizontal && movingHorizontally) || (options.dragVertical && movingVertically)) {
					dragging = true;
				} else if (hasTouch && ((!options.dragHorizontal && movingHorizontally) || (!options.dragVertical && movingVertically))) {
					// Drop this touch, allow them to scroll instead
					endPoint(pointer, true);
				}
			}
			
			if (dragging) {
				event.preventDefault();
			}
			
			if (pointerId !== undefined) {
				dispatchPointerEvent(options.onPointerMove);
			}
		}
	}
	
	function endPoint(pointer, noFlick) {
		endCapture();
		pointerId = undefined;
		if (unbindSuppressedEvents) {
			if (dragging) {
				// Delay a moment to suppress 'click' events immediately after mouseup
				setTimeout(unbindSuppressedEvents, 1);
			} else {
				unbindSuppressedEvents();
			}
			unbindSuppressedEvents = null;
		}
		dragging = false;
		if (pointer) {
			updatePoint(pointer);
		}
		if (noFlick) {
			velX = 0;
			velY = 0;
		}
		dispatchPointerEvent(options.onPointerEnd);
	}
	
	function movePointHover(pointer) {
		var prevPos = hoverPos;
		hoverPos = {
			pageX: pointer.pageX,
			pageY: pointer.pageY
		};
		(prevPos ? options.onHoverMove : options.onHoverStart)({
			pageX: pointer.pageX,
			pageY: pointer.pageY
		});	
	}
	
	function endPointHover(pointer) {
		if (hoverPos) {
			hoverPos = undefined;
			options.onHoverEnd({
				pageX: pointer.pageX,
				pageY: pointer.pageY
			});
		}
	}
	
	// setCapture prevents mouseenter/leave.  Check for it manually.
	function updatePointHoverManually(pointer) {
		if ($(pointer.target).closest(element).length) {
			movePointHover(pointer);
		} else {
			endPointHover(pointer);
		}
	}
	
	eventHandlers['touchstart'] = function(event) {
		// If our current touch isn't in the list of touches, it must have been lost somehow...
		if (pointerId !== undefined) {
			var touches = event.touches || event['originalEvent'].touches;
			var found = false;
			for (var i = 0; i < touches.length; ++i) {
				found = touches[i].identifier == pointerId;
				if (found) break;
			}
			if (!found) {
				endPoint(undefined, true);
			}
		}
		
		if (pointerId === undefined && !event.defaultPrevented) {
			var changedTouches = event.changedTouches || event['originalEvent'].changedTouches;
			var touch = changedTouches[0];
			startPoint(touch.identifier, touch);
			dispatchPointerEvent(options.onPointerStart);
		}
	}
	
	eventHandlers['touchmove'] = function(event) {
		var changedTouches = event.changedTouches || event['originalEvent'].changedTouches;
		for (var i = 0; i < changedTouches.length; ++i) {
			var touch = changedTouches[i];
			if (touch.identifier == pointerId) {
				movePoint(touch, event, touchDragTollerance);
				break;
			}
		}
	}
	
	eventHandlers['touchend'] = function(event) {
		var changedTouches = event.changedTouches || event['originalEvent'].changedTouches;
		for (var i = 0; i < changedTouches.length; ++i) {
			var touch = changedTouches[i];
			if (touch.identifier == pointerId) {
				endPoint(touch, event.type == 'touchcancel');
				break;
			}
		}
	}
	
	eventHandlers['touchcancel'] = eventHandlers['touchend'];
	
	eventHandlers['mouseenter'] = function(event) {
		if (!captureTarget) {
			movePointHover(event);
		}
	}
	
	eventHandlers['mouseleave'] = function(event) {
		if (!captureTarget) {
			endPointHover(event);
		}
	}
	
	eventHandlers['mousedown'] = function(event) {
		if (event.which == 1
			&& pointerId === undefined
			&& !event.defaultPrevented) {
			startPoint('mouse', event);
			pointerId = 'mouse';
			dispatchPointerEvent(options.onPointerStart);
			
			if (event.target
				&& !unbindSuppressedEvents) {
				// Started dragging, prevent clicks.
				var target = $(event.target);
				var prevent = function(targetEvent) {
					targetEvent.stopPropagation();
					return false;
				}
				
				// Create function to unbind the 'prevent' function
				unbindSuppressedEvents = function() {
					target.unbind(targetSuppressedEvents, prevent);
				}
				target.bind(targetSuppressedEvents, prevent);
			}
		
			// Suppress text selection
			return false;
		}
	}
	
	eventHandlers['mousemove'] = function(event) {
		if (pointerId == 'mouse') {
			if (hasSetCapture) {
				updatePointHoverManually(event);
			}
			movePoint(event, event, mouseDragTollerance);
		} else if (pointerId === undefined) {
			movePointHover(event);
		}
	}
	
	eventHandlers['mouseup'] = function(event) {
		if (event.which == 1
			&& pointerId == 'mouse') {
			endPoint(event, false);
		}
	}
	
	eventHandlers['dragstart'] = function(event) {
		// We can't allow drag-drop when we have our own drag
		return false;
	}
	
	eventHandlers['mousewheel'] = eventHandlers['DOMMouseScroll'] = function(event) {
		var originalEvent = event['originalEvent'];
		
		// Cancel if we already handled the other mousewheel/DOMMouseScroll
		if (originalEvent.defaultPrevented) return;
		
		var delta = -originalEvent.detail || (originalEvent.wheelDelta / 120) || 0;
		var deltaX = 0;
		var deltaY = delta;
    	
		if (originalEvent.axis !== undefined && originalEvent.axis === originalEvent.HORIZONTAL_AXIS) {
			deltaY = 0;
			deltaX = delta;
		} else if (originalEvent.wheelDeltaX !== undefined && originalEvent.wheelDeltaY !== undefined) {
			deltaX = originalEvent.wheelDeltaX / 120;
			deltaY = originalEvent.wheelDeltaY / 120;
		}
		
		if (delta != 0) {
			// Guess what the minimum step of this mousewheel is
			mouseWheelStep = Math.max(1, Math.min(Math.abs(delta), mouseWheelStep));
			
			options.onWheel({
				delta: delta,
				deltaX: deltaX,
				deltaY: deltaY,
				step: delta / mouseWheelStep,
				stepX: deltaX / mouseWheelStep,
				stepY: deltaY / mouseWheelStep
			});
			event.preventDefault();
		}
	}
	
	eventHandlers['losecapture'] = eventHandlers['contextmenu'] = function(event) {
		if (pointerId !== undefined) {
			endPoint(undefined, true);
		}
	}
	
	eventHandlers['selectstart'] = function() {
		// Prevent text selection in IE and FireFox
		return false;
	}
	
	var handleEvent = function(event) {
		return element && eventHandlers[event.type].apply(this, arguments);
	}
	
	this.remove = function() {
		if (hasTouch) {
			element.unbind(touchEvents, handleEvent);
		} else {
			element.unbind(mouseEvents, handleEvent);
		}
		endCapture();
		if (unbindSuppressedEvents) {
			unbindSuppressedEvents();
			unbindSuppressedEvents = null;
		}
	}
	
	if (hasTouch) {
		element.bind(touchEvents, handleEvent);
	} else {
		element.bind(mouseEvents, handleEvent);
	}
}