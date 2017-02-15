	

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

		if (this.c_geom.curvetype === 'B-spline' || this.c_geom.curvetype === 'Bézier') {
			if (span - this.c_geom.p  <=  this.i && this.i <= span) {
				return new JSCAGD.Vector3(this.i*10, this.height * N[this.i - span + this.c_geom.p] - this.height/2 +1, this.width * u - this.width/2);
			} else {
				return new JSCAGD.Vector3(this.i*10, - this.height/2 +1, this.width * u - this.width/2);
			}
		} else {
			return new JSCAGD.Vector3(this.i*10, this.height * N[this.i] - this.height/2 +1, this.width * u - this.width/2);
		}

	}
);

var BaseFunctionCurves = function(geometry, width, height) {
	THREE.Object3D.call(this);

	this.width = width;
	this.height = height;

	this.active = true;

	this.resetGeometry(geometry);
};

BaseFunctionCurves.prototype = Object.create(THREE.Object3D.prototype);

BaseFunctionCurves.prototype.constructor = BaseFunctionCurves;

BaseFunctionCurves.prototype.update = function () {
	if(this.active) {
		for (var i = 0; i < this.baseCurves.length; i++) {
			this.baseCurves[i].needsUpdate = true;
			this.baseTubes[i].dispose();
			this.baseTubes[i] = new THREE.TubeGeometry(
				this.baseCurves[i], //path
				400, //segments
				1, //radius
				3, //radiusSegments
				false //closed
			);
			this.baseTubeMeshes[i].geometry.dispose();
			this.baseTubeMeshes[i].geometry = this.baseTubes[i];
			this.baseTubeMeshes[i].geometry.verticesNeedUpdate = true;
			this.baseTubeMeshes[i].verticesNeedUpdate = true;
		}
	}
 	
};


BaseFunctionCurves.prototype.resetGeometry = function (newgeometry) {
	if(this.active) {
		this.geometry = newgeometry;

		this.baseCurves = [];
		this.baseTubes = [];
		this.baseTubeMeshes = [];

		if(typeof this.objcontainer !== 'undefined') {
			for (var i = 0; i < this.baseCurves.length; i++) {
				this.baseTubes[i].dispose();
				this.baseTubeMeshes[i].geometry.dispose();
			}
			this.remove(this.objcontainer);
		}
		

		this.objcontainer = new THREE.Object3D();
		var curvegeometry;
		for (var i = 0; i <= this.geometry.n; i++) {
			var material = new THREE.MeshLambertMaterial({
				color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
			});
			var baseCurve1 = new BaseCurve(this.geometry, i, this.width, this.height);
			var tube = new THREE.TubeGeometry(
				baseCurve1, //path
				400, //segments
				1, //radius
				3, //radiusSegments
				false //closed
			);

			var tubeMesh = new THREE.Mesh(tube, material);
			tubeMesh.dynamic = true;
			
			this.baseCurves.push(baseCurve1);
			this.baseTubes.push(tube);
			this.baseTubeMeshes.push(tubeMesh);
			this.objcontainer.add(tubeMesh);

		}
		this.add(this.objcontainer);

	}
};
