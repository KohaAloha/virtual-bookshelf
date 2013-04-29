var SubstituteImage_useIE8Shadow = $.browser.msie && /^[1-8]\./.test($.browser.version);


var SubstituteImage_queueTimeout;
var SubstituteImage_queueCallbacks = [];

/**
@private
*/
function SubstituteImage_dispatch() {
	SubstituteImage_queueTimeout = null;
	try {
		var callback = SubstituteImage_queueCallbacks.shift();
		callback();
	} finally {
		if (SubstituteImage_queueCallbacks.length) {
			SubstituteImage_queueTimeout = setTimeout(SubstituteImage_dispatch, 1);
		}
	}
}

/**
The SubstituteImage's substitute function is expensive.  This is used to queue the creation of substitute images one at a time.

@private
*/
function SubstituteImage_queue(callback) {
	SubstituteImage_queueCallbacks.push(callback);
	if (!SubstituteImage_queueTimeout) {
		SubstituteImage_queueTimeout = setTimeout(SubstituteImage_dispatch, 1);
	}
}


/**
@constructor
*/
function SubstituteImage(container, imageUrl, colorSeed, title, subtitle, authors, options) {
	function addBoxShadow(book) {
		if (SubstituteImage_useIE8Shadow) {
			var p = book.position();
			book.before($('<div class="shelf-ie-box-shadow">').css({
				'left': (p.left - 5) + 'px',
				'top': (p.top - 4) + 'px',
				'width': book.outerWidth() + 'px',
				'height': book.outerHeight() + 'px'
			}));
		} else {
			setVendorCss(book, 'boxShadow', options['boxShadow']);
		}
		
	}
	
	function substitute() {
		// Add substitute
		var random = new Random(colorSeed);
		var color = 'rgb(#,#,#)'.replace(/#/g, function() { return Math.floor(256 * (0.4 + 0.4 * random.next())) });
		var book = $('<div class="shelf-image-substitute">').css('background-color', color);
		container.append(book);
		
		var fontSize;
		var bookWidth = book.width();
		var bookHeight = book.height();
		
		// Shrink authors so they fits in the allowed size
		var authorsDiv = $('<div class="shelf-image-authors static">');
		if (authors) {
			for (var i = 0; i < authors.length; ++i) {
				authorsDiv.append($('<div>').text(authors[i]));
			}
		}
		book.append(authorsDiv);
		fontSize = options['authorsFontSize'];
		while (fontSize > 1
			&& (authorsDiv.outerHeight() > options['authorsMaxHeight'] || authorsDiv.outerWidth() > bookWidth)) {
			--fontSize;
			authorsDiv.css('font-size', fontSize + 'px');
		}
		authorsDiv.removeClass('static');
		
		var subtitleDiv;
		var subtitleHeight = 0;
		if (subtitle) {
			subtitleDiv = $('<div class="shelf-image-subtitle">').text(subtitle);
			book.prepend('<br>').prepend(subtitleDiv);
			// Shrink subtitle until it fits in the allowed size
			fontSize = options['subtitleFontSize'];
			while (fontSize > 1
				&& (subtitleDiv.outerHeight() > options['subtitleMaxHeight'] || subtitleDiv.outerWidth() > bookWidth)) {
				--fontSize;
				subtitleDiv.css('font-size', fontSize + 'px');
			}
			subtitleHeight = subtitleDiv.outerHeight();
		}
		
		// Shrink title until it fits in available space
		var titleDiv = $('<div class="shelf-image-title">').text(title);
		book.prepend('<br>').prepend(titleDiv);
		fontSize = options['titleFontSize'];
		var freeHeight = bookHeight - authorsDiv.outerHeight() - subtitleHeight;
		while (fontSize > 1
			&& (titleDiv.outerHeight() > freeHeight
				|| titleDiv.outerWidth() > bookWidth)) {
			--fontSize;
			book.css('font-size', fontSize + 'px');
		}
		
		// Position title and subtitle middle-ish-top
		var titleTotalHeight = titleDiv.outerHeight() + subtitleHeight;
		var titleY = Math.floor(Math.max(0, Math.min(
				(bookHeight - titleTotalHeight) * 0.2, // Nice middle-top
				(bookHeight - authorsDiv.outerHeight() - titleTotalHeight) / 2 // Dead-center of available space
			)));
		titleDiv.css('top', titleY + 'px');
		if (subtitleDiv) subtitleDiv.css('top', titleY + 'px');
		
		if (SubstituteImage_useIE8Shadow) {
			book.addClass('shelf-ie-no-text-shadow');
			titleDiv.prepend($('<div class="shelf-ie-text-shadow">').text(title));
			if (subtitleDiv) subtitleDiv.prepend($('<div class="shelf-ie-text-shadow">').text(subtitle));
			authorsDiv.prepend($('<div class="shelf-ie-text-shadow">').append(authorsDiv.children().clone()));
		}
		addBoxShadow(book);
		
		book.prepend($('<div class="shelf-image-bg">').css('background-image', 'url("' + options['background'] + '")'));
	}
	
	if (!imageUrl) {
		// Delay to wait for the container to be added to the DOM.
		SubstituteImage_queue(substitute);
	} else {
		var image = new Image();
		var ready = function() {
			image.onload = null;
			image.onerror = null;
			
			setTimeout(function() {
				var w = image.width;
				var h = image.height;
				if (w > 1 && h > 1) {
					// Loaded ok
					var book = $(image);
					var containerWidth = container.width();
					var containerHeight = container.height();
					if (h > containerHeight) {
						w = Math.round(w * containerHeight / h);
						h = containerHeight;
					}
					if (w > containerWidth) {
						h = Math.round(h * containerWidth / w);
						w = containerWidth;
					}
					book.css({
						'width': w.toFixed() + 'px',
						'height': h.toFixed() + 'px',
						'position': 'relative', // Needed for IE8's shadow to have correct z order
						'top': (containerHeight - h).toFixed() + 'px'
					});
					
					container.append(book);
					addBoxShadow(book);
				} else {
					// No cover image
					SubstituteImage_queue(substitute);
				}
			}, 1);
		}
		image.onload = ready;
		image.onerror = ready;
		image.src = imageUrl;
	}
}

