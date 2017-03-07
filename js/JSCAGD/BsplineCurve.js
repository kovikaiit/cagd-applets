"use strict";

var JSCAGD = JSCAGD || {};


/**
 * B-spline curve class inherited from ParametricCurve
 * @constructor
 * @param {List} P - Control points 
 * @param {Number} n - There are n-1 control points
 * @param {Number} p - The degree
 * @param {List} U - The list of the numbers in the knot vector
 */
JSCAGD.BsplineCurve = JSCAGD.ParametricCurve.create(
	function(P, n, p, U) {
		this.U = typeof U !== 'undefined' ? U : JSCAGD.KnotVector.createUniform(n, p);
		this.n = n;
		this.p = p;
		this.P = P;
		this.controlNetType = 'curve';
	},

	function(u) {
		var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
		var N = JSCAGD.BsplineBase.evalNonWanish(this.U, this.n, this.p, u, span);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;
		for (i = 0; i <= this.p; i++) {
			C.addScaledVector(this.P[span - this.p + i], N[i]);
		}
		return C;
	}
);


/**
 * Evals the i-th base function
 * @param {Number} t - Parameter
 * @param {Number} i - Index 
 * @return {Number} - The function value
 */
JSCAGD.BsplineCurve.prototype.evalBase = function(u, i) {
	var span = JSCAGD.KnotVector.findSpan(this.c_geom.U, this.c_geom.n, this.c_geom.p, u);
	if (span - this.c_geom.p  <=  i && i <= span) {
		var N = JSCAGD.BsplineBase.evalNonWanish(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);
		return  N[this.i - span + this.c_geom.p];
	} else {
		return 0;
	}
};


/**
 * Set the degree and reinitalize the uniform knot vector
 * @param {Number} p - Degree
 */
JSCAGD.BsplineCurve.prototype.setDegree = function(p) {
	this.p = p;
	this.U = JSCAGD.KnotVector.createUniform(this.n, this.p);
};


/**
 * Returns the d-th derivative of the curve
 * @param  {Number} d - Derivative
 * @param  {Number} u - Parameter
 * @return {JSCAGD.Vector3} - Derivative vector
 */
JSCAGD.BsplineCurve.prototype.getDeriv = function(d, u) {
	var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var der = JSCAGD.BsplineBase.evalNonWanishDer(this.U, this.n, this.p, u, span);
	var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
	var i;
	for (i = 0; i <= this.p; i++) {
		C.addScaledVector(this.P[span - this.p + i], der[d][i]);
	}
	return C;
};

/**
 * Returns all at most d-th derivative of the curve
 * @param  {Number} d - Derivative
 * @param  {Number} u - Parameter
 * @return {List} - Derivative vectors
 */
JSCAGD.BsplineCurve.prototype.getAllDeriv = function(d, u) {
	var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var der = JSCAGD.BsplineBase.evalNonWanishDer(this.U, this.n, this.p, u, span);
	var D = [];
	var i, j;
	for (j = 0; j <= d; j++) {
		D[j] = new JSCAGD.Vector3();
		for (i = 0; i <= this.p; i++) {
			D[j].addScaledVector(this.P[span - this.p + i], der[j][i]);
		}
	}
	return D;
};


/**
 * Tangent vector
 * @param  {Number} u - The parameter
 * @return {JSCAGD.Vector3}  - Tangent vector
 */
JSCAGD.BsplineCurve.prototype.getTangent = function(u) {
	var deriv = this.getDeriv(1, u);
	deriv.normalize();
	return deriv;
};

/**
 * Normal vector
 * @param  {Number} u - The parameter
 * @return {JSCAGD.Vector3}  - Normal vector
 */
JSCAGD.BsplineCurve.prototype.getNormal = function(u) {
	var tangent = this.getTangent(u);
	var deriv2 = this.getDeriv(2, u);
	var dot = deriv2.dot(tangent);
	deriv2.addScaledVector(tangent, -dot);
	deriv2.normalize();
	return deriv2;
};


/**
 * Binormal vector
 * @param  {Number} u - The parameter
 * @return {JSCAGD.Vector3}  - Binormal vector
 */
JSCAGD.BsplineCurve.prototype.getBinormal = function(u) {
	var tangent = this.getTangent(u);
	var normal = this.getNormal(u);
	var b = new JSCAGD.Vector3();
	return b.crossVectors(tangent, normal);
};

/**
 * Frenet frame vectors
 * @param  {Number} u - The parameter
 * @return {Object}  - The vector triplet
 */
JSCAGD.BsplineCurve.prototype.getFrenetFrame = function(u) {
	var derivs = this.getAllDeriv(2, u);

	// tangent
	derivs[1].normalize();

	// normal
	var dot = derivs[2].dot(derivs[1]);
	derivs[2].addScaledVector(derivs[1], -dot);
	derivs[2].normalize();

	// binormal
	var b = new JSCAGD.Vector3();
	b.crossVectors(derivs[1], derivs[2]);

	return {
		tangent: derivs[1],
		normal: derivs[2],
		binormal: b
	};
};


/**
 * Knot insertion at 'u'
 * @param  {Numer} u Parameter
 */
JSCAGD.BsplineCurve.prototype.insertKnot = function(u) {
	var k = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var r = 1;
	var s = 0;
	var i, j, L;
	for (i = 0; i < this.U.length; i++) {
		if(this.U[i] === u) {
			s++;
		}
	}

	if(r+s > this.p) {
		return;
	}
	var np = this.n;
	var p = this.p;
	var UP = this.U;
	var Pw = this.P;

	var mp = np + p + 1;
	var nq = np + r;
	var UQ = [];
	var Qw = [];
	var Rw = [];

	for (i = 0; i <= k; i++) {
		UQ[i] = UP[i];
	}
	for (i = 1; i <= r; i++) {
		UQ[k + i] = u;
	}
	for (i = k + 1; i <= mp; i++) {
		UQ[i + r] = UP[i];
	}
	for (i = 0; i <= k - p; i++) {
		Qw[i] = Pw[i];
	}
	for (i = k - s; i <= np; i++) {
		Qw[i + r] = Pw[i];
	}
	for (i = 0; i <= p - s; i++) {
		Rw[i] = Pw[k - p + i].clone();
	}
	for (j = 1; j <= r; j++) {
		L = k - p + j;
		for (i = 0; i <= p - j - s; i++) {
			var alpha = (u - UP[L + i]) / (UP[i + k + 1] - UP[L + i]);
			Rw[i].multiplyScalar(1.0 - alpha);
			Rw[i].addScaledVector(Rw[i + 1], alpha);
			
		}
		Qw[L] = Rw[0];
		Qw[k + r - j - s] = Rw[p - j - s];
	}
	for (i = L + 1; i < k - s; i++) {
		Qw[i] = Rw[i - L];
	}

	this.n = nq;
	this.P = Qw;
	this.U = UQ;

};


