"use strict";

var JSCAGD = JSCAGD || {};


/**
 * B-spline curve class inherited from ParamtericCurve
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - There are n-1 control points
 * @param {Number} p - The degree
 * @param {List} U - The list of the numbers in the knot vector
 */
JSCAGD.BsplineCurve = JSCAGD.ParamtericCurve.create(
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
 * Returns the d-th derivative of the curve
 * @param  {Number} d - Derivative
 * @param  {Number} u - Parameter
 * @return {JSCAGD.Vector3} - Derivative vector
 */
JSCAGD.BsplineCurve.prototype.getDeriv = function(d, u) {
	var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var der = JSCAGD.BsplineBase.evalNonWanishDer(this.U, this.n, this.p, u, span) ;
	var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
	var i;
	for (i = 0; i <= this.p; i++) {
		C.addScaledVector(this.P[span - this.p + i], der[d][i]);
	}
	return C;
};

/**
 * Set the degree and reinitalize the uniform knot vector
 * @param {Number} p - Degree
 */
JSCAGD.BsplineCurve.prototype.setDegree = function(p) {
	this.p = p;
	this.U = JSCAGD.KnotVector.createUniform(this.n, this.p);
}


