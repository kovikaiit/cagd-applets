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
 * @param  {Number} t  -  Parameter
 * @param  {List} U  - knot vector
 * @param  {Number} d  -  Fullness parameter
 * @return {List}   -   Base functions
 */
JSCAGD.PBase.eval = function(t, U, d) {
	var n = U.length - 1;
	var i;
	var r = [];
	var f = [];
	var w = [];
	var c1, cnm1, W, b1, bnm1;
	d /= 10;
	if (t === 1 || t === 0) {
		return JSCAGD.PBase.getSide(t, n + 1);
	}

	for (i = 1; i <= n - 1; i++) {
		r[i] = Math.sqrt((U[i] - t) * (U[i] - t) + d * d);
	}
	for (i = 1; i <= n - 2; i++) {
		if ((U[i + 1] - U[i]) !== 0) {
			f[i] = (r[i + 1] - r[i]) / (U[i + 1] - U[i]);
		} else {
			f[i] = (U[i] - t) / r[i];
		}
	}
	b1 = U[1] * (r[1] + U[1] - t) / t;
	w[0] = b1 / t;
	c1 = (b1 - U[1] + t) / r[1];
	w[1] = c1 + f[1];
	for (i = 2; i <= n - 2; i++) {
		w[i] = f[i] - f[i - 1];
	}
	bnm1 = (1 - U[n - 1]) * (r[n - 1] - U[n - 1] + t) / (1 - t);
	cnm1 = (bnm1 + U[n - 1] - t) / r[n - 1];
	w[n - 1] = cnm1 - f[n - 2];
	w[n] = bnm1 / (1 - t);
	W = w[0] + c1 + cnm1 + w[n];
	for (i = 0; i <= n; i++) {
		w[i] /= W;
	}
	return w;
};
