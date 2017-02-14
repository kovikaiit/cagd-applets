"use strict";

var JSCAGD = JSCAGD || {};

/**
 * Container for static P base functions 
 * @namespace
 */
JSCAGD.PBase = {};


/**
 * Indicator functios for the degenerated cases, t=0 or t=1
 * @param  {Number} t parameter
 * @param  {Number} n Number of base functions
 * @return {List}   Base functions
 */
JSCAGD.PBase.getSide = function(t, n) {
	var i;
	var basis = [];
	for (i = 0; i < n; i++) {
		basis[i] = 0;
	}
	if (t === 0) {
		basis[0] = 1;
		return basis;
	} else if (t === 1) {
		basis[n - 1] = 1;
		return basis;
	}
	return basis;
};

/**
 * Evaluate P base functions
 * @param  {Number} t    Parameter
 * @param  {List} knots knots vector
 * @param  {Number} d    Fullness parameter
 * @return {List}      Base functions
 */
JSCAGD.PBase.eval = function(t, knots, d) {
	var n = knots.length;
	var i;
	var r = [];
	var b = [];
	var total = 0;
	var basis = [];
	if (t === 1 || t === 0) {
		return JSCAGD.PBase.getSide(t, n);
	}
	for (i = 0; i < n; i++) {
		r[i] = Math.sqrt((knots[i] - t) * (knots[i] - t) + (0.1 * d) * (0.1 * d));
		if (i !== n - 1) {
			b[i] = 1 / (knots[i + 1] - knots[i]);
		}
	}
	basis[0] = (r[1] + (knots[1] - t)) / b[0] / (t * t);
	total += basis[0];
	basis[1] = (1 / t + (knots[1] - t) / (t * r[1])) / b[0] + r[2] * b[1] - r[1] * b[1] - (knots[1] - t) / r[1];
	total += basis[1];
	for (i = 2; i < n - 2; i++) {
		basis[i] = (r[i - 1] * b[i - 1] + r[i + 1] * b[i] - (b[i - 1] + b[i]) * r[i]);
		total += basis[i];
	}
	basis[n - 2] = (1 / (1 - t) - (knots[n - 2] - t) / ((1 - t) * r[n - 2])) / b[n - 2] + r[n - 3] * b[n - 3] - r[n - 2] * b[n - 3] + (knots[n - 2] - t) / r[n - 2]; 
	total += basis[n - 2];
	basis[n - 1] = (r[n - 2] / ((1 - t) * (1 - t)) - (knots[n - 2] - t) / ((1 - t) * (1 - t))) / b[n - 2];
	total += basis[n - 1];
	for (i = 0; i < n; i++) {
		basis[i] /= total;
	}
	return basis;
};
