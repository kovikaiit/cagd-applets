"use strict";

var JSCAGD = JSCAGD || {};

/**
 * Container for static Mean vaue Barycentric coordinates
 * @namespace
 */
JSCAGD.MeanValue = {};


JSCAGD.MeanValue.eval = function(V, v) {
	var n = V.length;
	var f = [];
	var s = [];
	var r = [];
	var A = [];
	var D = [];
	var W = 0;
	var i, i1, im1, w;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		s[i] = V[i].clone();
		s[i].addScaledVector(v, -1);
		r[i] = s[i].length();
		if (r[i] === 0) {
			f[i] = 1;
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		i1 = (i + 1) % n;
		A[i] = -(s[i].x * s[i1].y - s[i].y * s[i1].x) / 2;
		D[i] = s[i].dot(s[i1]);
		if (A[i] === 0 && D[i] < 0) {
			f[i] = r[i1] / (r[i] + r[i1]);
			f[i1] = r[i] / (r[i] + r[i1]);
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		w = 0;
		i1 = (i + 1) % n;
		im1 = ((i - 1) % n + n) % n;
		if (A[im1] !== 0) {
			w += (r[im1] - D[im1] / r[i]) / A[im1];
		}
		if (A[i] !== 0) {
			w += (r[i1] - D[i] / r[i]) / A[i];
		}
		f[i] = w;
		W += w;
	}
	for (i = 0; i < n; i++) {
		f[i] /= W;
	}
	return f;
};


JSCAGD.MeanValue.evalBuhera = function(V, v) {
	var n = V.length;
	var f = [];
	var s = [];
	var r = [];
	var A = [];
	var D = [];
	var W = 0;
	var i, i1, im1, w;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		s[i] = V[i].clone();
		s[i].addScaledVector(v, -1);
		r[i] = s[i].length();
		if (r[i] === 0) {
			f[i] = 1;
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		i1 = (i + 1) % n;
		A[i] = -(s[i].x * s[i1].y - s[i].y * s[i1].x) / 2;
		D[i] = s[i].dot(s[i1]);
		if (A[i] === 0 && D[i] < 0) {
			f[i] = r[i1] / (r[i] + r[i1]);
			f[i1] = r[i] / (r[i] + r[i1]);
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		w = 0;
		i1 = (i + 1) % n;
		im1 = ((i - 1) % n + n) % n;
		if (A[im1] !== 0) {
			w += (r[im1] - D[im1] / r[i]) / (A[im1]*A[im1]);
		}
		if (A[i] !== 0) {
			w += (r[i1] - D[i] / r[i]) / (A[i]*A[i]);
		}
		f[i] = w;
		W += w;
	}
	for (i = 0; i < n; i++) {
		f[i] /= W;
	}
	return f;
};




JSCAGD.MeanValue.evalBuhera2 = function(V, v) {
	var n = V.length;
	var f = [];
	var s = [];
	var r = [];
	var A = [];
	var D = [];
	var W = 0;
	var i, i1, im1, w;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		s[i] = V[i].clone();
		s[i].addScaledVector(v, -1);
		r[i] = s[i].length();
		if (r[i] === 0) {
			f[i] = 1;
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		i1 = (i + 1) % n;
		A[i] = -(s[i].x * s[i1].y - s[i].y * s[i1].x) / 2;
		D[i] = s[i].dot(s[i1]);
		if (A[i] === 0 && D[i] < 0) {
			f[i] = r[i1] / (r[i] + r[i1]);
			f[i1] = r[i] / (r[i] + r[i1]);
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		w = 0;
		i1 = (i + 1) % n;
		im1 = ((i - 1) % n + n) % n;

		w += 1/(r[i]*r[i]) * (1/r[i1] + 1/r[im1]);
		
		
		f[i] = w;
		W += w;
	}
	for (i = 0; i < n; i++) {
		f[i] /= W;
	}
	return f;
};
