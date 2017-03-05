"use strict";

var JSCAGD = JSCAGD || {};

/**
 * Container for static Mean vaue Barycentric coordinates
 * @namespace
 */
JSCAGD.MeanValue = {};

/**
 * Evaluate Mean Value generalized barycentric coordinates
 * @param  {List} V - Polygon
 * @param  {Vector} v - Planar point 
 * @return {List} -  Coordinates
 */
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
		if (r[i] < JSCAGD.epsilon) {
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


/**
 * Based on Ju et al. Mean Value Coordinates for Closed Triangular Meshes 2005
 * Evaluate Mean Value generalized barycentric coordinates in 3D	
 * @param  {List} V  - Vertices of the polytope	
 * @param  {List} T - Faces (trianlges)
 * @param  {Vector} v - 3D Point
 * @return {List}   Coordinates
 */
JSCAGD.MeanValue.evalTriMesh = function(V, T, x) {
	var n = V.length;
	var f = [];
	var total = 0, tmp;
	var l, theta;
	var d = [];
	var u = [];
	var tmpvec, h, c, s;
	var i, i1, i2, i3;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		tmpvec = V[i].clone();
		tmpvec.addScaledVector(x, -1);
		d[i] = tmpvec.length();
		if(d[i] < JSCAGD.epsilon) {
			f[i] = 1;
			return f;
		}
		tmpvec.normalize()
		u[i] = tmpvec;
	}
	
	for (i = 0; i < T.length; i++) {
		l = [];
		c = [];
		s = [];
		theta = [];
		h = 0;
		for (var k = 0; k < 3; k++) {
			tmpvec = u[T[i][(k+1)%3]].clone();
			tmpvec.addScaledVector(u[T[i][(k+2)%3]], -1);
			l[k] = tmpvec.length();
			theta[k] = 2 * Math.asin(l[k] / 2);
			
			h += theta[k];
		}
		h = h/2;
		if(Math.abs(Math.PI - h) < JSCAGD.epsilon) {
			// x lies on T[i]
			f[T[i][0]] = Math.sin(theta[0])*d[1]*d[2];
			f[T[i][1]] = Math.sin(theta[1])*d[0]*d[2];
			f[T[i][2]] = Math.sin(theta[2])*d[1]*d[0];

			return f;
		}

		for (var k = 0; k < 3; k++) {
			c[k] = (2 * Math.sin(h) * Math.sin(h - theta[k]))/ (Math.sin(theta[(k+1)%3])*Math.sin(theta[(k+2)%3])) - 1;
			//s[k] = Math.sign[ ... ] * Math.sqrt(1-c[k]*c[k]); 
			s[k] = Math.sqrt(1-c[k]*c[k]); 
			//ONLY INSIDE A CONVEX DOMAIN!!!!
			//NOT WORK FOR CONCAVE CASES
		}

		if(s[0] < JSCAGD.epsilon || s[1] < JSCAGD.epsilon || s[2] < JSCAGD.epsilon) {
			continue;
		}
		
		for (var k = 0; k < 3; k++) {
			tmp = (theta[k] - c[(k+1)%3]*theta[(k+2)%3] - c[(k+2)%3]*theta[(k+1)%3]) / (d[T[i][k]] *Math.sin(theta[(k+1)%3])* s[(k+2)%3]);
			f[T[i][k]] += tmp; //ONLY INSIDE A CONVEX DOMAIN!!!!
			total +=  tmp;
			//debug(s[(k+2)%3]);
		}

	}
	//debug(total);
	for (i = 0; i < n; i++) {
		f[i] /= total;
	}
	return f;
};










