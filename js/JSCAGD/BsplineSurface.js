"use strict";

var JSCAGD = JSCAGD || {};


/**
 * Bezier surface class inherited from ParametricSurface
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - Degree u
 * @param {Number} n - Degree v
 */
JSCAGD.BsplineSurface = JSCAGD.ParametricSurface.create(

	function(P, n, m, p) {
		this.p = p;
		this.n = n;
		this.m = typeof m !== 'undefined' ? m : n;
		this.P = P;
		this.Uu = JSCAGD.KnotVector.createUniform(n, p);
		this.Uv = JSCAGD.KnotVector.createUniform(m, p);
	},

	function(u, v) {
		var spanu = JSCAGD.KnotVector.findSpan(this.Uu, this.n, this.p, u);
		var N = JSCAGD.BsplineBase.evalNonWanish(this.Uu, this.n, this.p, u, spanu);
		var spanv = JSCAGD.KnotVector.findSpan(this.Uv, this.m, this.p, v);
		var M = JSCAGD.BsplineBase.evalNonWanish(this.Uv, this.m, this.p, v, spanv);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i, j;
		for (i = 0; i <= this.p; i++) {
			for (j = 0; j <= this.p; j++) {
				C.addScaledVector(this.P[spanu - this.p + i][spanv - this.p + j], N[i]*M[j]);
			}
		}
		return C;
	}

);