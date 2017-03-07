	

"use strict";

/* globals JSCAGD */
/* globals THREE */

var baseFunctionsParameters = {

		radius: 1,

		resolution: 400,

		//seed: 'jhbjhbjh '

		knotinsertmode: false,
		knotinsertindex: 0,
		newbasecolor: '#000000'
};

var is3D = is3D || false;

var BaseCurve = JSCAGD.ParametricCurve.create(
	function(c_geom, i, width, height) {
		this.i = typeof i !== 'undefined' ? i : 1;
		this.c_geom = c_geom;
		this.width = width-2;
		this.height = height;
	},

	function(u) {

		var N;
		var span;
		if(this.c_geom.curvetype === 'meang1test') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner5_TEST(u, this.c_geom.knot, this.c_geom.d);
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

BaseCurve.prototype.getTube = function() {
	
	return new THREE.TubeGeometry(
				this, //path
				baseFunctionsParameters.resolution, //segments
				baseFunctionsParameters.raduis, //radius
				3, //radiusSegments
				false //closed
			);
};

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
			this.baseTubes[i] = this.baseCurves[i].getTube();
			
			this.baseTubeMeshes[i].geometry.dispose();
			this.baseTubeMeshes[i].geometry = this.baseTubes[i];
			this.baseTubeMeshes[i].geometry.verticesNeedUpdate = true;
			this.baseTubeMeshes[i].verticesNeedUpdate = true;
		}
	}
 	
};


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    function componentToHex(c) {
    	var hex = Math.round(c).toString(16);
	    return hex.length == 1 ? "0" + hex : hex;
	}
    return '#' + componentToHex(r * 255) + componentToHex(g * 255)  + componentToHex(b * 255);
}




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
		//Math.seedrandom(baseFunctionsParameters.seed);
		for (var i = 0; i <= this.geometry.n; i++) {
			var icolor = hslToRgb(0.2*i- Math.floor(0.2*i),1.00,0.43);
			if(baseFunctionsParameters.knotinsertmode) {
				if(i === baseFunctionsParameters.knotinsertindex) {
					icolor = baseFunctionsParameters.newbasecolor;
				} else if (i >= baseFunctionsParameters.knotinsertindex) {
					 icolor = hslToRgb(0.2*(i-1)- Math.floor(0.2*(i-1)),1.00,0.43);
				}
			} 
			
			var material = new THREE.MeshLambertMaterial({
				color: icolor

				//color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
			});
			var baseCurve1 = new BaseCurve(this.geometry, i, this.width, this.height);
			var tube = baseCurve1.getTube();

			var tubeMesh = new THREE.Mesh(tube, material);
			tubeMesh.dynamic = true;
			tubeMesh.geometry.verticesNeedUpdate = true;
			tubeMesh.verticesNeedUpdate = true;
			
			this.baseCurves.push(baseCurve1);
			this.baseTubes.push(tube);
			this.baseTubeMeshes.push(tubeMesh);
			this.objcontainer.add(tubeMesh);

		}
		this.add(this.objcontainer);
		baseFunctionsParameters.knotinsertmode = false;
	}
};
