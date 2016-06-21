"use strict";

/* globals THREE */

/**
 * Main namespace
 * @namespace
 */
var JSCAGD = JSCAGD || {};


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

JSCAGD.ParametricSurface.create = function ( constructor, getPointFunc ) {

	constructor.prototype = Object.create( JSCAGD.ParametricSurface.prototype );
	constructor.prototype.constructor = constructor;
	constructor.prototype.getPoint = getPointFunc;

	return constructor;

};