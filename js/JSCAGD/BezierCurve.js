"use strict";

var JSCAGD = JSCAGD || {};


/**
 * Bezier curve class inherited from ParamtericCurve
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - Degree
 */
JSCAGD.BezierCurve = JSCAGD.ParamtericCurve.create(
	function(P, n) {
		this.n = typeof n !== 'undefined' ? n : P.length - 1;
		this.P = P;
		this.controlNetType = 'curve';
	},

	function(u) {
		var N = JSCAGD.BernsteinBase.evalAll(this.n, u);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;
		for (i = 0; i <= n; i++) {
			C.addScaledVector(this.P[i], N[i]);
		}
		return C;
	}
);
