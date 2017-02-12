"use strict";

var JSCAGD = JSCAGD || {};

/**
 * Container for static Bernstein base functions 
 * @namespace
 */
JSCAGD.BernsteinBase = {};

/**
 * Degree n i-th Bernstein base function at u
 * @param {Number} i - The number of the function
 * @param {Number} n - The degree of the basis functions
 * @param {Number} u - The parameter value
 */
JSCAGD.BernsteinBase.eval = function(i, n, u) {
	var temp = [];
	var k, j;
	var u1 = 1.0 - u;
	for (k = 0; k <= n; k++) {
		temp.push(0.0);
	}
	temp[n - i] = 1.0;
	for (k = 1; k <= n; k++) {
		for (j = n; j >= k; j--) {
			temp[j] = u1 * temp[j] + u * temp[j - 1];
		}
	}
	return temp[n];
};


/**
 * All degree n i-th Bernstein base function at u
 * @param {Number} n - The degree of the basis functions
 * @param {Number} u - The parameter value
 */
JSCAGD.BernsteinBase.evalAll = function(n, u) {
	var B = [];
	var k, j;
	var u1 = 1.0 - u;
	for (k = 0; k <= n; k++) {
		B.push(0.0);
	}
	B[0] = 1.0;
	for (j = 1; j <= n; j++) {
		var saved = 0.0;
		for (k = 0; k < j; k++) {
			var temp = B[k];
			B[k] = saved + u1 * temp;
			saved = u * temp;
		}
		B[j] = saved;
	}
	return B;
};

/**
 * All degree n i-th Bernstein base function at u
 * @param {Number} n - The degree of the basis functions
 * @param {List} n - The weights
 * @param {Number} u - The parameter value
 */
JSCAGD.BernsteinBase.evalAllRational = function(n, W, u) {
	var B = [];
	var k, j;
	var u1 = 1.0 - u;
	var total = 0;
	for (k = 0; k <= n; k++) {
		B.push(0.0);
	}
	B[0] = 1.0;
	for (j = 1; j <= n; j++) {
		var saved = 0.0;
		for (k = 0; k < j; k++) {
			var temp = B[k];
			B[k] = saved + u1 * temp;
			saved = u * temp;
		}
		B[j] = saved;
	}
	for (j = 1; j <= n; j++) {
		B[j] *= W[j];
		total += B[j];
	}
	for (j = 1; j <= n; j++) {
		B[j] /= total;
	}
	return B;
};

/**
 * Container for static knot vector functions
 * @namespace
 */
JSCAGD.KnotVector = {};

/**
 * Creates a simple uniform knor vector with p degree
 * @param {Number} n - There are n + 1 control points
 * @param {Number} p - The degree
 */
JSCAGD.KnotVector.createUniform = function(n, p) {
	if(p > n) 
	{
		p= n;
	}
	var U = [];
	var m = n + p + 1;
	var diff = 1 / (m - 2 * p);
	var sumdiff = 0;
	var i;
	for (i = 0; i < p + 1; i += 1) {
		U.push(0);
	}
	for (i = 0; i < (m - 2 * p - 1); i += 1) {
		sumdiff += diff;
		U.push(sumdiff);
	}
	for (i = 0; i < p + 1; i += 1) {
		U.push(1);
	}
	return U;
};


/**
 * Helper function to find the non-zero base functions
 * @param {List} U - The knot vector
 * @param {Number} n - There are n + 1 control points
 * @param {Number} p - The degree
 * @param {Number} u - The parameter value
 * @return {Number} mid - The span value
 */
JSCAGD.KnotVector.findSpan = function(U, n, p, u) {
	if (u === U[n + 1]) {
		return n; //(n + 1) in NURBS Book ???
	}
	var low = p;
	var high = n + 1;
	var mid = parseInt((low + high) / 2);
	while (u < U[mid] || u >= U[mid + 1]) {
		if (u < U[mid]) {
			high = mid;
		} else {
			low = mid;
		}
		mid = parseInt((low + high) / 2);
	}
	return mid;
};

/**
 * Container for static B-spline base functions
 * @namespace
 */
JSCAGD.BsplineBase = {};

/**
 * Calculate the non zero basis functions 
 * @param {List} U - The knot vector
 * @param {Number} n - There are n + 1 control points
 * @param {Number} p - The degree
 * @param {Number} u - The parameter value
 * @param {Number} i - MUST BE the findSpan result
 * @return {List} N - The values of base functions
 */
JSCAGD.BsplineBase.evalNonWanish = function(U, n, p, u, i) {
	i = typeof i !== 'undefined' ? i : JSCAGD.KnotVector.findSpan(U, n, p, u);

	var N = [];
	var left = [];
	var right = [];
	var j, r;
	var temp, saved;
	N[0] = 1.0;
	for (j = 1; j <= p; j++) {
		left[j] = u - U[i + 1 - j];
		right[j] = U[i + j] - u;
		saved = 0.0;
		for (r = 0; r < j; r++) {
			temp = N[r] / (right[r + 1] + left[j - r]);
			N[r] = saved + right[r + 1] * temp;
			saved = left[j - r] * temp;
		}
		N[j] = saved;
	}
	return N;
};

/**
 * Calculate the non zero basis functions and all derivatives
 * @param {List} U - The knot vector
 * @param {Number} n - There are n + 1 control points
 * @param {Number} p - The degree
 * @param {Number} u - The parameter value
 * @param {Number} i - MUST BE the findSpan result
 * @return {List} ders - The derivatives of base functions
 */
JSCAGD.BsplineBase.evalNonWanishDer = function(U, n, p, u, i) {
	i = typeof i !== 'undefined' ? i : JSCAGD.KnotVector.findSpan(U, n, p, u);

	var ders = [];
	var left = [];
	var right = [];
	var ndu = [];
	var a = [];

	var j, r, k, s1, s2, rk, pk, j1, j2;
	var temp, saved, d;

	for (j = 0; j <= p; j++) {
		ndu.push([]);
		for (r = 0; r <= p; r++) {
			ndu[j].push(0.0);
		}
	}
	for (j = 0; j < 2; j++) {
		a.push([]);
		for (r = 0; r <= p; r++) {
			a[j].push(0.0);
		}
	}
	for (k = 0; k <= n; k++) {
		ders.push([]);
		for (r = 0; r <= p; r++) {
			ders[k].push(0.0);
		}
	}

	ndu[0][0] = 1.0;
	for (j = 1; j <= p; j++) {
		left[j] = u - U[i + 1 - j];
		right[j] = U[i + j] - u;
		saved = 0.0;
		for (r = 0; r < j; r++) {
			ndu[j][r] = right[r + 1] + left[j - r];
			temp = ndu[r][j - 1] / ndu[j][r];
			ndu[r][j] = saved + right[r + 1] * temp;
			saved = left[j - r] * temp;
		}
		ndu[j][j] = saved;
	}
	for (j = 0; j <= p; j++) {
		ders[0][j] = ndu[j][p];
	}
	for (r = 0; r <= p; r++) {
		s1 = 0;
		s2 = 1;
		a[0][0] = 1.0;
		for (k = 1; k <= n; k++) {
			d = 0.0;
			rk = r - k;
			pk = p - k;
			if (r >= k) {
				a[s2][0] = a[s1][0] / ndu[pk + 1][rk];
				d = a[s2][0] * ndu[rk][pk];
			}
			if (rk >= -1) {
				j1 = 1;
			} else {
				j1 = -rk;
			}
			if (r - 1 <= pk) {
				j2 = k - 1;
			} else {
				j2 = p - r;
			}
			for (j = j1; j <= j2; j++) {
				a[s2][j] = (a[s1][j] - a[s1][j - 1]) / ndu[pk + 1][rk + j];
				d += a[s2][j] * ndu[rk + j][pk];
			}
			if (r <= pk) {
				a[s2][k] = -a[s1][k - 1] / ndu[pk + 1][r];
				d += a[s2][k] * ndu[r][pk];
			}
			ders[k][r] = d;
			j = s1;
			s1 = s2;
			s2 = j;
		}
	}
	r = p;
	for (k = 1; k <= n; k++) {
		for (j = 0; j <= p; j++) {
			ders[k][j] *= r;
		}
		r *= (p - k);
	}
	return ders;
};