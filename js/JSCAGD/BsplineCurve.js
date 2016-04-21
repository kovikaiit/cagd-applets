"use strict";

var JSCAGD = JSCAGD || {};


/**
 * B-spline curve class inherited from ParametricCurve
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - There are n-1 control points
 * @param {Number} p - The degree
 * @param {List} U - The list of the numbers in the knot vector
 */
JSCAGD.BsplineCurve = JSCAGD.ParametricCurve.create(
	function(P, n, p, U) {
		this.U = typeof U !== 'undefined' ? U : JSCAGD.KnotVector.createUniform(n, p);
		this.n = n;
		this.p = p;
		this.P = P;
		this.controlNetType = 'curve';
	},

	function(u) {
		var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
		var N = JSCAGD.BsplineBase.evalNonWanish(this.U, this.n, this.p, u, span);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;
		for (i = 0; i <= this.p; i++) {
			C.addScaledVector(this.P[span - this.p + i], N[i]);
		}
		return C;
	}
);

/**
 * Set the degree and reinitalize the uniform knot vector
 * @param {Number} p - Degree
 */
JSCAGD.BsplineCurve.prototype.setDegree = function(p) {
	this.p = p;
	this.U = JSCAGD.KnotVector.createUniform(this.n, this.p);
};


/**
 * Returns the d-th derivative of the curve
 * @param  {Number} d - Derivative
 * @param  {Number} u - Parameter
 * @return {JSCAGD.Vector3} - Derivative vector
 */
JSCAGD.BsplineCurve.prototype.getDeriv = function(d, u) {
	var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var der = JSCAGD.BsplineBase.evalNonWanishDer(this.U, this.n, this.p, u, span);
	var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
	var i;
	for (i = 0; i <= this.p; i++) {
		C.addScaledVector(this.P[span - this.p + i], der[d][i]);
	}
	return C;
};

/**
 * Returns all at most d-th derivative of the curve
 * @param  {Number} d - Derivative
 * @param  {Number} u - Parameter
 * @return {List} - Derivative vectors
 */
JSCAGD.BsplineCurve.prototype.getAllDeriv = function(d, u) {
	var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var der = JSCAGD.BsplineBase.evalNonWanishDer(this.U, this.n, this.p, u, span);
	var D = [];
	var i, j;
	for (j = 0; j <= d; j++) {
		D[j] = new JSCAGD.Vector3();
		for (i = 0; i <= this.p; i++) {
			D[j].addScaledVector(this.P[span - this.p + i], der[j][i]);
		}
	}
	return D;
};


/**
 * Tangent vector
 * @param  {Number} u - The parameter
 * @return {JSCAGD.Vector3}  - Tangent vector
 */
JSCAGD.BsplineCurve.prototype.getTangent = function(u) {
	var deriv = this.getDeriv(1, u);
	deriv.normalize();
	return deriv;
};

/**
 * Normal vector
 * @param  {Number} u - The parameter
 * @return {JSCAGD.Vector3}  - Normal vector
 */
JSCAGD.BsplineCurve.prototype.getNormal = function(u) {
	var tangent = this.getTangent(u);
	var deriv2 = this.getDeriv(2, u);
	var dot = deriv2.dot(tangent);
	deriv2.addScaledVector(tangent, -dot);
	deriv2.normalize();
	return deriv2;
};


/**
 * Binormal vector
 * @param  {Number} u - The parameter
 * @return {JSCAGD.Vector3}  - Binormal vector
 */
JSCAGD.BsplineCurve.prototype.getBinormal = function(u) {
	var tangent = this.getTangent(u);
	var normal = this.getNormal(u);
	var b = new JSCAGD.Vector3();
	return b.crossVectors(tangent, normal);
};


JSCAGD.BsplineCurve.prototype.getFrenetFrame = function(u) {
	var derivs = this.getAllDeriv(2, u);

	// tangent
	derivs[1].normalize();
	
	// normal
	var dot = derivs[2].dot(derivs[1]);
	derivs[2].addScaledVector(derivs[1], -dot);
	derivs[2].normalize();

	// binormal
	var b = new JSCAGD.Vector3();
	b.crossVectors(derivs[1], derivs[2]);

	return {
		tangent: derivs[1],
		normal: derivs[2],
		binormal: b
	};
};








