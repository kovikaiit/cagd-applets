"use strict";

var JSCAGD = JSCAGD || {};


/**
 * Bezier surface class inherited from ParametricSurface
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - Degree u
 * @param {Number} n - Degree v
 */
JSCAGD.BezierSurface = JSCAGD.ParametricSurface.create(

	function(P, n, m) {
		this.n = n;
		this.m = typeof m !== 'undefined' ? m : n;
		this.P = P;
		this.controlNetType = 'surfaceQuadNet';
	},

	function(u, v) {
		var N = JSCAGD.BernsteinBase.evalAll(this.n, u);
		var M = JSCAGD.BernsteinBase.evalAll(this.m, v);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;
		for (i = 0; i <= n; i++) {
			for (j = 0; j <= m; j++) {
				C.addScaledVector(this.P[i * (n + 1) + j], N[i] * M[j]);
			}
		}
		return C;
	}

);