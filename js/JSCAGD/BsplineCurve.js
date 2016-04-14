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
	},

	function(u) {
		var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
		var N = JSCAGD.BsplineBase.evalNonWanish(this.U, this.n, this.p, u, span) ;
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;
		for (i = 0; i <= 3; i++) {
			C.addScaledVector(this.P[span - 3 + i], N[i]);
		}
		return C;
	}
);