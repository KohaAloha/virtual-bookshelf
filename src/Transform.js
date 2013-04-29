var initTransform;

/**
@constructor
*/
function ElementPositionTransform(element) {
	this.element = element;
	this.e = this.element.get(0);
	initTransform(this.e);
}

/**
@constructor
*/
function ElementScaleTransform(element, x, y, width, height) {
	this.element = element;
	this.e = this.element.get(0);
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	initTransform(this.e);
}

(function() {
	var style = $('<div>').get(0).style;
	var transform = findVendorName(style, 'transform');
	var transformOrigin = findVendorName(style, 'transformOrigin');
	
	if (transformOrigin) {
		initTransform = function(e) {
			e.style.position = 'absolute';
			e.style[transformOrigin] = '0 0';
			e.style.left = 0;
			e.style.top = 0;
		}
	} else {
		initTransform = function(e) {
			e.style.position = 'absolute';
		}
	}
	
	if (transform && transformOrigin && findVendorName(style, 'perspective')) {
		// Accelerated transform
		ElementPositionTransform.prototype.setTopLeft = function(x, y) {
			this.e.style[transform] = 'translate3d(' + x.toFixed(3) + 'px,' + y.toFixed(3) + 'px,0)';
		}
		ElementScaleTransform.prototype.setTopLeft = function(x, y, z, sx, sy) {
			this.e.style[transform] = 'translate3d('
				+ (x + this.x * sx).toFixed(3) + 'px,'
				+ (y + this.y * sy).toFixed(3) + 'px,0) scale3d('
				+ sx.toFixed(3) + ','
				+ sy.toFixed(3) + ',1)';
			this.e.style.zIndex = Math.floor(z);
		}
	} else {
		ElementPositionTransform.prototype.setTopLeft = function(x, y) {
			this.e.style.left = Math.round(x) + 'px';
			this.e.style.top = Math.round(y) + 'px';
		}
		ElementScaleTransform.prototype.setTopLeft = function(x, y, z, sx, sy) {
			// Correct for sub-pixel aliasing.
			var left = x + this.x * sx;
			var top = y + this.y * sy;
			var right = left + this.width * sx;
			var bottom = top + this.height * sy;
			left = Math.round(left);
			top = Math.round(top);
			this.e.style.left = left + 'px';
			this.e.style.top = top + 'px';
			this.e.style.width = Math.round(right - left) + 'px';
			this.e.style.height = Math.round(bottom - top) + 'px';
			
			this.e.style.zIndex = Math.floor(z);
		}
	}
})();