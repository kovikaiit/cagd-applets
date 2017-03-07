"use strict";

var JSCAGD = JSCAGD || {};


/**
 * P-surface class inherited from ParametricSurface
 */
JSCAGD.PSurface = JSCAGD.ParametricSurface.create(

	function(P, n, m,  du, dv, knotsU, knotsV) {
		this.n = n;
		this.m = typeof m !== 'undefined' ? m : n;
		this.P = P;
		this.controlNetType = 'surfaceQuadNet';
		this.du = typeof du !== 'undefined' ? du : 2 / (this.n + 1);
		this.dv = typeof dv !== 'undefined' ? dv : 2 / (this.n + 1);
		this.P = P;
		var i;
		
		if(typeof knotsU !== 'undefined') {
			this.knotsU = knotsU;
		} else {
			this.knotsU = [];
			for (i = 0; i <= this.n; i++) {

				this.knotsU.push(i / this.n);
			}
		}
		
		if(typeof knotsV !== 'undefined') {
			this.knotsV = knotsV;
		} else {
			this.knotsV = [];
			for (i = 0; i <= this.m; i++) {

				this.knotsV.push(i / this.m);
			}
		}
	},

	function(u, v) {
		var N = JSCAGD.PBase.eval(u, this.knotsU, this.du);
		var M = JSCAGD.PBase.eval(v, this.knotsV, this.dv);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i, j;
		for (i = 0; i <= this.n; i++) {
			for (j = 0; j <= this.m; j++) {
				C.addScaledVector(this.P[i][j], N[i] * M[j]);
			}
		}
		return C;
	}

);