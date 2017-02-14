	

"use strict";

/* globals JSCAGD */
/* globals THREE */

var is3D = is3D || false;

var BaseCurve = JSCAGD.ParametricCurve.create(
	function(c_geom, i, width, height) {
		this.i = typeof i !== 'undefined' ? i : 1;
		this.c_geom = c_geom;
		this.width = width;
		this.height = height;
	},

	function(u) {
		//u = typeof u !== 'undefined' ? u : 0.5;
		//console.log(u);
		//var span = JSCAGD.KnotVector.findSpan(this.c_geom.U, this.c_geom.n, this.c_geom.p, u);

		//var N = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.c_geom.knot, this.c_geom.d);

		var N;
		var span;
		if(this.c_geom.curvetype === 'meang1test') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner5(u, this.c_geom.knot, this.c_geom.d);
		} else if(this.c_geom.curvetype === 'meang1' || this.c_geom.curvetype === 'P-curve') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.c_geom.knot, this.c_geom.d);
		} else if (this.c_geom.curvetype === 'meang0') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner3(u, this.c_geom.knot, this.c_geom.d);
		} else if (this.c_geom.curvetype === 'cyclicInf') {
			N = JSCAGD.MeanBase.evalAllCyclic1(u, this.c_geom.n+1, this.c_geom.d);
		} else if (this.c_geom.curvetype === 'cyclicTricky') {
			N = JSCAGD.MeanBase.evalAllCyclic2(u, this.c_geom.n+1, this.c_geom.d);
		}	else if (this.c_geom.curvetype === 'B-spline' || this.c_geom.curvetype === 'Bézier') {
			span = JSCAGD.KnotVector.findSpan(this.c_geom.U, this.c_geom.n, this.c_geom.p, u);
			N = JSCAGD.BsplineBase.evalNonWanish(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);
		}	else if (this.c_geom.curvetype === 'ratBezier') {

			N = JSCAGD.BernsteinBase.evalAllRational(this.c_geom.n, this.c_geom.W, u);
		}
		//var N = JSCAGD.MeanBase.evalAllCyclic2(u, this.c_geom.n+1, this.c_geom.d);
		//var N = JSCAGD.BsplineBase.evalNonWanishDer(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);

		//var N = JSCAGD.BernsteinBase.evalAll(this.c_geom.n, u);
		if (this.c_geom.curvetype === 'B-spline' || this.c_geom.curvetype === 'Bézier') {
			if (span - this.c_geom.p  <=  this.i && this.i <= span) {
				return new JSCAGD.Vector3(0, this.height * N[this.i - span + this.c_geom.p] - this.height/2, this.width * u - this.width/2);
			} else {
				return new JSCAGD.Vector3(0, - this.height/2, this.width * u - this.width/2);
			}
		} else {
			return new JSCAGD.Vector3(0, this.height * N[this.i] - this.height/2, this.width * u - this.width/2);
		}
		
	
	}
);




var BaseFunctionCurves = function(geometry, width, height) {
	THREE.Object3D.call(this);

	this.width = width;
	this.height = height;
	this.geometry = geometry;

	this.baseCurves = [];

	var curvegeometry;
	this.objcontainer = new THREE.Object3D();
	for (var i = 0; i <= geometry.n; i++) {
		var material = new THREE.LineBasicMaterial({
			//color: "#"+((1<<24)*Math.random()|0).toString(16) //color: "#000000", 
			linewidth: 2 ,
			color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
		});
		var baseCurve1 = new BaseCurve(geometry, i, width, height);
		curvegeometry = new THREE.Geometry();
		curvegeometry.curve = baseCurve1;
		curvegeometry.vertices = baseCurve1.getPoints( 300 );
		curvegeometry.dynamic = true;

		this.baseCurves.push(curvegeometry);
		var curveObject = new THREE.Line(curvegeometry, material);
		curveObject.dynamic = true;
		this.objcontainer.add(curveObject);
		this.update();
	}
	this.add(this.objcontainer);

};

BaseFunctionCurves.prototype = Object.create(THREE.Object3D.prototype);

BaseFunctionCurves.prototype.constructor = BaseFunctionCurves;

BaseFunctionCurves.prototype.update = function () {
	for (var i = 0; i < this.baseCurves.length; i++) {
		//this.baseCurves[i].vertices = this.baseCurves[i].curve.getPoints( 10 );
		//var u_min = 0;
		//var u_max = 1;
		
		var u_min = 0;
		var u_max = 1;
		var samples = 300;
		var diff = (u_max - u_min) / (samples );
		var u = u_min;
		for (var j = 0; j < samples; j++) {
			//this.baseCurves[i].curve.getPoint( u );
			this.baseCurves[i].vertices[j] = this.baseCurves[i].curve.getPoint( u );
			u += diff;2
		}
		this.baseCurves[i].vertices[samples] = this.baseCurves[i].curve.getPoint( u_max );
		//this.baseCurves[i].vertices = this.baseCurves[i].curve.getPoints( 100 );
		this.baseCurves[i].verticesNeedUpdate = true;
	}
};



BaseFunctionCurves.prototype.resetGeometry = function (newgeometry) {

	this.geometry = newgeometry;

	this.baseCurves = [];
	this.remove(this.objcontainer);
	this.objcontainer = new THREE.Object3D();
	var curvegeometry;
	for (var i = 0; i <= this.geometry.n; i++) {
		var material = new THREE.LineBasicMaterial({
			linewidth: 2 ,
			color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
		});
		var baseCurve1 = new BaseCurve(this.geometry, i, this.width, this.height);
		curvegeometry = new THREE.Geometry();
		curvegeometry.curve = baseCurve1;
		curvegeometry.vertices = baseCurve1.getPoints( 99 );
		curvegeometry.dynamic = true;

		this.baseCurves.push(curvegeometry);
		var curveObject = new THREE.Line(curvegeometry, material);
		curveObject.dynamic = true;
		this.objcontainer.add(curveObject);
	}
	this.add(this.objcontainer);
	this.update();

};
