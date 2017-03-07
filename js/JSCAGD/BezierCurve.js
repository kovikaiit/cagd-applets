"use strict";

var JSCAGD = JSCAGD || {};


/**
 * Bezier curve class inherited from ParametricCurve
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - Degree
 */
JSCAGD.BezierCurve = JSCAGD.ParametricCurve.create(
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

/**
 * Degree elevation
 */
JSCAGD.BezierCurve.prototype.elevateDegree = function() {
	var Q = [];
	Q[0] = this.P[0].clone();
	for (var i = 1; i <= this.n; i++) {
		Q[i] = this.P[i-1].clone();
		Q[i].multiplyScalar(i/(this.n+1));
		Q[i].addScaledVector(this.P[i], 1 - i/(this.n+1));
	}
	Q[this.n+1] = this.P[this.n].clone();
	this.n += 1;
	this.P = Q;
};


/**
 * Degree reduction
 */
JSCAGD.MeanCurve.prototype.reduceDegree = function() {
	var Q = [];
	var nui;
	var i;
	Q[0] = this.P[0].clone();
	Q[this.n-1] = this.P[this.n].clone();
	for (i = 1; i <= (this.n-1)/2; i++) {
		nui = i / this.n;
		Q[i] = this.P[i].clone();
		Q[i].addScaledVector(Q[i-1], -nui);
		Q[i].multiplyScalar(1/(1-nui));
	}
	for (i = this.n - 1; i >= this.n/2; i--) {
		nui = i / this.n;
		Q[i-1] = this.P[i].clone();
		Q[i-1].addScaledVector(Q[i], -(1-nui));
		Q[i-1].multiplyScalar(1/nui);
	}
	this.n -= 1;
	this.P = Q;
};



