"use strict";

/* globals THREE */

/**
 * Main namespace
 * @namespace
 */
var JSCAGD = JSCAGD || {};

JSCAGD.epsilon = 0.000001;


JSCAGD.Vector3 = THREE.Vector3;
JSCAGD.Vector2 = THREE.Vector2;

JSCAGD.ParametricCurve = THREE.Curve;


/**
 * Abstract parametric surface base class
 */
JSCAGD.ParametricSurface = function () {};


JSCAGD.ParametricSurface.prototype = {

	constructor: JSCAGD.ParametricSurface,

	getPoint: function ( u, v ) {

		console.warn( "JSCAGD.ParametricSurface: Warning, getPoint() not implemented!" );
		return null;

	}

};

JSCAGD.ParametricSurface.prototype.getMesh = function(res) {
	var i, j, u, v, t0, t1, t2, t3;
	var V = [];
	var T = [];
	var uvs = [];
	var diff = 1 / (res - 1);
	for (i = 0; i < res; i++) {
		for (j = 0; j < res; j++) {
			u = i*diff;
			v = j*diff;
			uvs.push(new THREE.Vector2(u, v));
			V.push(this.getPoint(u,v));
			if(i !== res-1 && j !== res-1) {
				t0 = i*res + j;
				t1 = i*res + j + 1;
				t2 = (i+1)*res + j;
				t3 = (i+1)*res + j+1;
				T.push([t0, t1, t2], [t2, t1, t3]);
			}		
		}
	}
	var mesh = new JSCAGD.TriMesh(V, T);
	mesh.uvs = uvs;
	mesh.build();
	return mesh;
};

JSCAGD.ParametricSurface.prototype.getVertices = function(res) {
	var i, j, u, v;
	var V = [];
	var diff = 1 / (res - 1);
	for (i = 0; i < res; i++) {
		for (j = 0; j < res; j++) {
			u = i*diff;
			v = j*diff;
			V.push(this.getPoint(u,v));
		}
	}
	return V;
};

JSCAGD.ParametricSurface.create = function ( constructor, getPointFunc ) {

	constructor.prototype = Object.create( JSCAGD.ParametricSurface.prototype );
	constructor.prototype.constructor = constructor;
	constructor.prototype.getPoint = getPointFunc;

	return constructor;

};