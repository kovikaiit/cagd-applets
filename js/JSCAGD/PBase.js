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


//TODO clean Up
JSCAGD.PBase.evalC0 = function(u, knot, d) {
	var n = knot.length;
	var i;
	var r = [];
	var b = [];
	var total = 0;
	var basis = [];
	if(u===1 || u === 0) {
		return JSCAGD.PBase.getSide(u, n );
	}
	for (i = 0; i < n; i++) {
		r[i] = Math.sqrt((knot[i] - u) * (knot[i] - u) + (0.1 * d) * (0.1 * d));
		if (i !== n - 1) {
			b[i] = 1 / (knot[i + 1] - knot[i]);
		}
	}
	basis[0] = (r[1] * b[0] - r[0] * b[0]) + r[0] / u;
	total += basis[0];

	for (i = 1; i < n - 1; i++) {
		basis[i] = (r[i - 1] * b[i - 1] + r[i + 1] * b[i] - (b[i - 1] + b[i]) * r[i]);
		total += basis[i];
	}
	basis[n - 1] = (r[n - 2] * b[n - 2] - r[n - 1] * b[n - 2]) + r[n - 1] / (1 - u);
	total += basis[n - 1];
	for (i = 0; i < n; i++) {
		basis[i] /= total;
	}
	return basis;
};
