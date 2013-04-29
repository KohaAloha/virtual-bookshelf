/**
@constructor

Fades from one item to another using opacity.  Nicely handles delays and fading when you change your mind mid-transition.

Just call show(element) to add it to the container and fade it in when necessary.  If it never gets to
be shown, it's never added.

*/
function FadeTransition(container, outDuration, inDelay, inDuration) {
	inDelay = inDelay || 0;
	inDuration = (inDuration >= 0) ? inDuration : outDuration;
	
	var initTime = now();
	
	var prev;
	var prevFadeTime = initTime; // Time fully faded out
	var current;
	var currentFadeTime = initTime; // If !next, time full faded in, else time faded out
	var currentAdded;
	var next;
	var frame;
	var timeout;
	
	function setOpacity(element, value) {
		element.css('opacity', clamp(0.01, value, 1));
	}
	
	function update() {
		frame = undefined;
		timeout = undefined;
		
		var t = now();
		if (next) {
			if (currentAdded) {
				// Fading out current
				if (t < currentFadeTime) {
					setOpacity(current, (currentFadeTime - t) / outDuration);
				} else {
					current.remove();
					currentAdded = false;
				}
			}
			if (!currentAdded) {
				current = next;
				next = undefined;
				currentFadeTime = Math.max(t, Math.max(t, prevFadeTime) + inDelay) + inDuration;
			}
		}
		if (current && !next) {
			// Fading in current
			if (t >= currentFadeTime - inDuration) {
				if (!currentAdded) {
					// Create if only a jQuery string
					current = $(current);
				}
				setOpacity(current, 1 - (currentFadeTime - t) / inDuration);
				if (!currentAdded) {
					container.append(current);
					currentAdded = true;
				}
			}
		}
		if (prev) {
			if (t < prevFadeTime) {
				setOpacity(prev, (prevFadeTime - t) / outDuration);
			} else {
				prev.remove();
				prev = undefined;
			}
		}
		
		if (prev || (t >= currentFadeTime - inDuration && t < currentFadeTime)) {
			// Actively animating
			frame = requestFrame(update);
		} else if (t < currentFadeTime) {
			// Waiting to fade in current
			timeout = setTimeout(update, currentFadeTime - inDuration - t);
		}
	}
	
	function stop() {
		clearTimeout(timeout);
		timeout = undefined;
		cancelFrame(frame);
		frame = undefined;
	}
	
	this['show'] = function(element) {
		stop();
		if (!next) {
			// Current will be fading out now
			var t = now();
			currentFadeTime = t + Math.min(1, 1 - (currentFadeTime - t) / inDuration) * outDuration;
		}
		next = element;
		if (prev) {
			// Transition to next when current and previous have faded out
		} else {
			if (currentAdded) {
				// Make current the previous for fading out
				prev = current;
				prevFadeTime = currentFadeTime;
				currentAdded = false;
			}
			current = undefined;
		}
		update();
	}
	
	this['remove'] = stop;
}