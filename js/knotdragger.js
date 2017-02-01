"use strict";


    
var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();


var createHiDPICanvas = function(w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
};



var KnotDragger = function(geometry, onChange) {

	var size = 8;
	var height = 20;

	var draggers = [];

	var x_min = 0;
	var x_max = 500;
	var x_diff = x_max - x_min;

	var n = geometry.n;
	var p = geometry.p;

	var U = geometry.U;

	var u_min, u_max, div_x;

	var container = document.getElementById('knotSlider');

	while (container.firstChild) {
	    container.removeChild(container.firstChild);
	}

	for (var i = 0; i < n - p; i++) {
		var dragger = document.createElement("div");
		dragger.name = 'draggable-element';
		dragger.className = "dragger";
		dragger.style.width = size + 'px';
		dragger.style.height = height + 'px';
		dragger.style.left = U[p + i + 1] * x_diff - size / 2 + 'px';
		dragger.knotIndex = p + i + 1;

		var canv = createHiDPICanvas(2*size, 2*height);
		var c2 = canv.getContext('2d');
		c2.fillStyle = '#2fa1d6';
		c2.beginPath();
		c2.moveTo(size/2, 0);
		c2.lineTo(size, size/2);
		c2.lineTo(size, height);
		c2.lineTo(0, height);
		c2.lineTo(0, size/2);
		c2.closePath();
		c2.fill();

		dragger.appendChild(canv);


		draggers.push(dragger);

		container.appendChild(dragger);

		dragger.onmousedown = function() {
			_drag_init(this);
			return false;
		};
	}

	var selected = null, x_pos = 0, x_elem = 0;

	function _drag_init(elem) {
		selected = elem;
		x_elem = x_pos - selected.offsetLeft ;
		u_min = U[selected.knotIndex - 1] * x_diff;
		u_max = U[selected.knotIndex + 1] * x_diff;
	}


	// Will be called when user dragging an element
	function _move_elem(e) {
		x_pos = document.all ? window.event.clientX : e.pageX;
		if (selected !== null) {
			var x_now = x_pos - x_elem;
			x_now = Math.max(Math.min(x_now, u_max - size / 2), u_min - size / 2);
			selected.style.left = (x_now) + 'px';
			var newKnot = (x_now + size / 2) / x_diff;
			//U[selected.knotIndex] = newKnot;
			U[selected.knotIndex] = Math.max(Math.min(newKnot, 1- 0.000000000001), 0.0000000000001);
			onChange();

		}
	}


	function _destroy() {
		selected = null;
	}


	document.onmousemove = _move_elem;
	document.onmouseup = _destroy;

};




var KnotDraggerMean = function(geometry, onChange) {

	var size = 8;
	var height = 20;

	var draggers = [];

	var x_min = 0;
	var x_max = 500;
	var x_diff = x_max - x_min;

	var n = geometry.n;


	var U = geometry.knot;

	var u_min, u_max, div_x;

	var container = document.getElementById('knotSlider');

	while (container.firstChild) {
	    container.removeChild(container.firstChild);
	}

	for (var i = 0; i < n + 1; i++) {
		var dragger = document.createElement("div");
		dragger.name = 'draggable-element';
		dragger.className = "dragger";
		dragger.style.width = size + 'px';
		dragger.style.height = height + 'px';
		dragger.style.left = U[i] * x_diff - size / 2 + 'px';
		dragger.knotIndex = i;

		var canv = createHiDPICanvas(2*size, 2*height);
		var c2 = canv.getContext('2d');
		c2.fillStyle = '#2fa1d6';
		c2.beginPath();
		c2.moveTo(size/2, 0);
		c2.lineTo(size, size/2);
		c2.lineTo(size, height);
		c2.lineTo(0, height);
		c2.lineTo(0, size/2);
		c2.closePath();
		c2.fill();

		dragger.appendChild(canv);


		draggers.push(dragger);

		container.appendChild(dragger);

		dragger.onmousedown = function() {
			_drag_init(this);
			return false;
		};
	}

	var selected = null, x_pos = 0, x_elem = 0;

	function _drag_init(elem) {
		selected = elem;
		x_elem = x_pos - selected.offsetLeft ;
		u_min = U[selected.knotIndex - 1] * x_diff;
		u_max = U[selected.knotIndex + 1] * x_diff;
	}


	// Will be called when user dragging an element
	function _move_elem(e) {
		x_pos = document.all ? window.event.clientX : e.pageX;
		if (selected !== null) {
			var x_now = x_pos - x_elem;
			x_now = Math.max(Math.min(x_now, u_max - size / 2), u_min - size / 2);
			selected.style.left = (x_now) + 'px';
			var newKnot = (x_now + size / 2) / x_diff;
			//U[selected.knotIndex] = newKnot;
			U[selected.knotIndex] = Math.max(Math.min(newKnot, 1- 0.000000000001), 0.0000000000001);
			onChange();

		}
	}


	function _destroy() {
		selected = null;
	}


	document.onmousemove = _move_elem;
	document.onmouseup = _destroy;

};