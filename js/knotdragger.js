"use strict";

var KnotDragger = function(geometry, onChange) {

	var size = 10;

	var draggers = [];

	var x_min = 0;
	var x_max = 500;
	var x_diff = x_max - x_min;

	var n = geometry.n;
	var p = geometry.p;

	var U = geometry.U;

	var u_min, u_max;

	var container = document.getElementById('knotSlider');


	for (var i = 0; i < n - p; i++) {
		var dragger = document.createElement("div");
		dragger.name = 'draggable-element';
		dragger.className = "dragger";
		dragger.style.width = size + 'px';
		dragger.style.height = 20 + 'px';
		dragger.style.left = U[p + i + 1] * x_diff - size / 2 + 'px';
		dragger.knotIndex = p + i + 1;

		var canv = document.createElement("canvas");
		var c2 = canv.getContext('2d');
		c2.fillStyle = '#f00';
		c2.beginPath();
		c2.moveTo(0, 0);
		c2.lineTo(100, 50);
		c2.lineTo(50, 100);
		c2.lineTo(0, 90);
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
		x_elem = x_pos - selected.offsetLeft;
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
			U[selected.knotIndex] = (x_now + size / 2) / x_diff;
			onChange();

		}
	}


	function _destroy() {
		selected = null;
	}


	document.onmousemove = _move_elem;
	document.onmouseup = _destroy;

};