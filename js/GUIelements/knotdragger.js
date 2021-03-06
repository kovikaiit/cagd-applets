"use strict";

var espilon0 =  0.000000000001;
    
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
	var size = 6;
	var height = 20;
	var x_min = 0;
	var x_max = 500;
	var x_diff = x_max - x_min;
	this.geometry = geometry;
	this.onChange = onChange;
	//Moving point
	size = 6;
	this.paramdragger = document.createElement("div");
	this.paramdragger.name = 'draggable-element';
	this.paramdragger.className = "dragger";
	this.paramdragger.style.width = size + 'px';
	this.paramdragger.style.height = height + 'px';
	
	this.tparam = 0.5;
	this.paramdragger.style.left = this.tparam * x_diff - size / 2 + 'px';
	//this.paramdragger.style.left = 20 + 'px';
		


	var canv = createHiDPICanvas(2*size, 2*height);
	var c2 = canv.getContext('2d');
	c2.fillStyle = '#2e9800';
	c2.beginPath();
	c2.moveTo(size/2, 0);
	c2.lineTo(size, size/2);
	c2.lineTo(size, height);
	c2.lineTo(0, height);
	c2.lineTo(0, size/2);
	c2.closePath();
	c2.fill();

	this.paramdragger.appendChild(canv);

	this.showParam = false;
	if( !this.showParam) {
		this.paramdragger.style.display = 'none';
	}

	this.reset();
};

KnotDragger.prototype.destroy = function() {
	//TODO: implement
	//for (var i = this.draggers.length - 1; i >= 0; i--) {
		//this.draggers[i].parent.removeChild(this.draggers[i]);
	//	this.draggers[i].dispose();
	//}
};

KnotDragger.prototype.updateParam = function(t) {
	this.tparam = t;
	var size = 6;
	var x_min = 0;
	var x_max = 500;
	var x_diff = x_max - x_min;
	this.paramdragger.style.left = this.tparam * x_diff - size / 2 + 'px';
};


KnotDragger.prototype.setShowParam = function(t) {
	if( !this.showParam) {
		this.paramdragger.style.display = 'none';
	} else {
		this.paramdragger.style.display = 'block';
	}
};


KnotDragger.prototype.reset = function() {
	var size = 8;
	var height = 20;

	this.draggers = [];

	var x_min = 0;
	var x_max = 500;
	var x_diff = x_max - x_min;

	var n = this.geometry.n;
	var p =  this.geometry.p;
	var U ;
	if( this.geometry.curvetype === 'B-spline'){
		U =  this.geometry.U;
	} else if ( this.geometry.curvetype === 'P-curve' ||  this.geometry.curvetype === 'meang1test') {
		U =  this.geometry.knot;
	}

	

	var u_min, u_max, div_x;

	var container = document.getElementById('knotSlider');

	while (container.firstChild) {
	    container.removeChild(container.firstChild);
	}
	var upper;
	if( this.geometry.curvetype === 'B-spline'){
		upper = n-p;
	} else if ( this.geometry.curvetype === 'P-curve' ||  this.geometry.curvetype === 'meang1test') {
		upper = n+1;
	}
	for (var i = 0; i < upper; i++) {
		var dragger = document.createElement("div");
		dragger.name = 'draggable-element';
		dragger.className = "dragger";
		dragger.style.width = size + 'px';
		dragger.style.height = height + 'px';
		if(this.geometry.curvetype === 'B-spline') {
			dragger.style.left = U[p + i + 1] * x_diff - size / 2 + 'px';
			dragger.knotIndex = p + i + 1;
		} else  if ( this.geometry.curvetype === 'P-curve' ||  this.geometry.curvetype === 'meang1test') {
			dragger.style.left = U[i] * x_diff - size / 2 + 'px';
			dragger.knotIndex = i;
		}


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


		this.draggers.push(dragger);

		container.appendChild(dragger);

		dragger.onmousedown = function() {
			_drag_init(this);
			return false;
		};
	}
	

	//this.draggers.push(dragger);

	container.appendChild(this.paramdragger);

	var selected = null, x_pos = 0, x_elem = 0;

	function _drag_init(elem) {
		selected = elem;
		x_elem = x_pos - selected.offsetLeft ;
		u_min = U[selected.knotIndex - 1] * x_diff;
		u_max = U[selected.knotIndex + 1] * x_diff;
	}

	var that = this;
	// Will be called when user dragging an element
	function _move_elem(e) {
		x_pos = document.all ? window.event.clientX : e.pageX;
		if (selected !== null) {
			var x_now = x_pos - x_elem;
			x_now = Math.max(Math.min(x_now, u_max - size / 2), u_min - size / 2);
			selected.style.left = (x_now) + 'px';
			var newKnot = (x_now + size / 2) / x_diff;
			//U[selected.knotIndex] = newKnot;
			U[selected.knotIndex] = Math.max(Math.min(newKnot, 1- espilon0), espilon0);
			that.onChange();

		}
	}


	function _destroy() {
		selected = null;
	}


	document.onmousemove = _move_elem;
	document.onmouseup = _destroy;
};

