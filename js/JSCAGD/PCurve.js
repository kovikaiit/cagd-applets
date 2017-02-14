"use strict";

var JSCAGD = JSCAGD || {};

/**
 * The P-curve
 * @param  {List} P             The control points
 * @param  {Number} d           Fulness parameter
 * @param  {List} knots    		The knot vector
 */
JSCAGD.PCurve = JSCAGD.ParametricCurve.create(
	function(P, knots, d) {
		this.n = P.length - 1;
		this.d = typeof d !== 'undefined' ? d : 2 / (this.n + 1);
		this.P = P;
		var i;
		if(typeof knots !== 'undefined' && knots.length === this.n + 1) {
			this.knots = knots;
		} else {
			this.knots = [];
			for (i = 0; i <= this.n; i++) {
				this.knots.push(i / this.n);
			}
		}
	},

	function(u) {
		var N = JSCAGD.PBase.eval(u, this.knot, this.d);
		var C = new JSCAGD.Vector3(0, 0, 0);
		var i;
		for (i = 0; i <= this.n; i++) {
			C.addScaledVector(this.P[i], N[i]);
		}
		return C;
	}
);


/**
 * Knot insertion at t
 * @param  {Number} t 
 */
JSCAGD.PCurve.prototype.insertKnot = function(t) {
	var i = this.findSpan(t);
	var before = this.knots[i];
	var next = this.knots[i + 1];
	var dist = next - before;
	var lm = (next - t) / dist;
	var newPoint = this.P[i].clone();
	newPoint.multiplyScalar(lm);
	newPoint.addScaledVector(this.P[i+1], 1 - lm);
	this.knots.splice(i + 1, 0, t);
	this.P.splice(i+1, 0, newPoint);
	this.n += 1;
};

/**
 * Find the correspponding knot interval
 * @param  {Number} t Parameter
 * @return {Numbet}   The knot interval index
 */
JSCAGD.PCurve.prototype.findSpan = function(t) {
	if (t === 0) {
		return 1;
	}
	if (t === 1) {
		return this.n;
	}
	for (var i = 1; i <= this.n; i++) {
		if (this.knots[i] > t) {
			return i-1;
		}
	}
};
