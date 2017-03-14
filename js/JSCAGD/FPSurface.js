"use strict";

var JSCAGD = JSCAGD || {};

JSCAGD.FPSurface = {};

JSCAGD.FPSurface.genGridPolytope = function(n, m, d) {
	var V = [];
	var F = [];
	var diffu = 1 / (n - 1);
	var diffv = 1 / (m - 1);
	var t0, t1, t2, t3;
	for (var i = 0; i < n; i++) {
		for (var j = 0; j < m; j++) {
			var v = new JSCAGD.Vector3(i * diffu, j * diffv, d);
			var vm = new JSCAGD.Vector3(i * diffu, j * diffv, -d);
			V.push(v);
			V.push(vm);
			if (i !== n - 1 && j !== m - 1) {
				t0 = i * m + j;
				t1 = i * m + j + 1;
				t2 = (i + 1) * m + j;
				t3 = (i + 1) * m + j + 1;
				var f1 = [2 * t0, 2 * t1, 2 * t3, 2 * t2];
				var f2 = [2 * t0 + 1, 2 * t2 + 1, 2 * t3 + 1, 2 * t1 + 1];
				f1.border = false;
				f2.border = false;
				var sideNum = [];
				if (i === 0) {
					sideNum.push( 1);
				} else if (i === n-2){
				//	sideNum.push(3);
				}
				if (j === 0) {
				//	sideNum.push (2);
				} else if (j === m-2){
				//	sideNum.push(4);
				} 
				f1.sideNum = sideNum;
				f2.sideNum = sideNum;
				F.push(f1);
				F.push(f2);
			}
		}
	}
	var fs1 = [], fs2 = [];
	for (var i = 0; i < n; i++) {
		fs1.push(2*(i * m + 0));
		fs2.push(2*((n-1-i) * m + m-1));
	}
	for (var i = 0; i < n; i++) {
		fs1.push(2*(m * (n-1-i) + 0) + 1);
		fs2.push(2*(i * m + m-1) + 1);
	}

	var fs3 = [], fs4 = [];
	for (var j = 0; j < n; j++) {
		fs3.push(2*(0 * m + (m-1-j)));
		fs4.push(2*((n-1) * m + j));
	}
	for (var j = 0; j < n; j++) {
		fs3.push(2*(0 * m + j)+1);
		fs4.push(2*((n-1) * m + (m-1-j))+1);
	}
	fs1.border = true;
	fs1.sideNum = [2];
	fs2.border = true;
	fs2.sideNum = [4];
	fs3.border = true;
	fs3.sideNum = [1];
	fs4.border = true;
	fs4.sideNum = [3];

	F.push(fs1, fs2, fs3, fs4);
	return new JSCAGD.PolyMesh(V, F);
};




/**
 * FP-surface C0 class inherited from ParametricSurface
 */
JSCAGD.FPSurfaceC0 = JSCAGD.ParametricSurface.create(

	function(P, n, m, d) {
		this.n = n;
		this.m = typeof m !== 'undefined' ? m : n;
		this.P = P;
		this.P0 = [];
		this.P1 = [];
		this.P2 = [];
		this.P3 = [];
		for (var i = 0; i <= n; i++) {
			this.P0[i] = P[i][0]; //todo: side points
		}
		
		this.du = d;
		
		this.P = P;
		var i;
		
		this.polytope = JSCAGD.FPSurface.genGridPolytope(n+1, m+1, d/10);
	},

	function(u, v) {

		var x0 = new THREE.Vector3(u, v, 0);

		var B = JSCAGD.MeanValue.evalPolyMeshFP(this.polytope.V, this.polytope.T, x0);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i, j;
		for (i = 0; i <= this.n; i++) {
			for (j = 0; j <= this.m; j++) {
				C.addScaledVector(this.P[i][j], 2 * B[2*(i*(this.m+1) + j)]);
			}
		}
		return C;
	}

);

JSCAGD.FPSurfaceC0.prototype.setD = function(d) {
	this.du = d;
	this.polytope = JSCAGD.FPSurface.genGridPolytope(this.n+1, this.m+1, d/10);
};
