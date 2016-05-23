"use strict";

var JSCAGD = JSCAGD || {};

/**
 * Container for static Bernstein base functions 
 * @namespace
 */
JSCAGD.MeanBase = {};

JSCAGD.MeanBase.evalAll = function(n, u, d) {
	var topPoints = [];
	var i;
	topPoints.push(new JSCAGD.Vector3(0, -d, 0));
	for (i = 0; i < n; i++) {
		topPoints.push(new JSCAGD.Vector3(i / (n - 1), d, 0));
	}
	topPoints.push(new JSCAGD.Vector3(1, -d, 0));
	var meanValues = [];
	var sum = 0;
	for (i = 0; i < n; i++) {
		var actualVec = new JSCAGD.Vector3(u, 0, 0);
		var vec0 = topPoints[i].clone();
		vec0.addScaledVector(actualVec, -1);
		var vec1 = topPoints[i + 1].clone();
		vec1.addScaledVector(actualVec, -1);
		var vec2 = topPoints[i + 2].clone();
		vec2.addScaledVector(actualVec, -1);
		var alpha1 = vec0.angleTo(vec1);
		var alpha2 = vec1.angleTo(vec2);
		var ri = vec1.length();
		var wi = 2 * (Math.tan(alpha1 / 2) + Math.tan(alpha2 / 2)) / ri;
		//wi *= wi;
		meanValues.push(wi);
		sum += wi;
	}
	for (i = 0; i < n; i++) {
		meanValues[i] /= sum;
	}
	return meanValues;
};

JSCAGD.MeanBase.evalAllGeneral = function(n, u, topPoints) {
	var meanValues = [];
	var i;
	var sum = 0;
	for (i = 0; i < n; i++) {
		var actualVec = new JSCAGD.Vector3(u, 0, 0);
		var vec0 = topPoints[i].clone();
		vec0.addScaledVector(actualVec, -1);
		var vec1 = topPoints[i + 1].clone();
		vec1.addScaledVector(actualVec, -1);
		var vec2 = topPoints[i + 2].clone();
		vec2.addScaledVector(actualVec, -1);
		var alpha1 = vec0.angleTo(vec1);
		var alpha2 = vec1.angleTo(vec2);
		var ri = vec1.length();
		var wi = 2 * (Math.tan(alpha1 / 2) + Math.tan(alpha2 / 2)) / ri;
		//wi *= wi;
		meanValues.push(wi);
		sum += wi;
	}
	for (i = 0; i < n; i++) {
		meanValues[i] /= sum;
	}
	return meanValues;
};


JSCAGD.MeanCurve = JSCAGD.ParametricCurve.create(
	function(P, n, d) {
		this.n = typeof n !== 'undefined' ? n : P.length - 1;
		this.d = typeof d !== 'undefined' ? d : 1 / (n + 1);
		this.topPoints = [];
		var i;
		this.topPoints.push(new JSCAGD.Vector3(0, -this.d, 0));
		for (i = 0; i < this.n + 1; i++) {
			this.topPoints.push(new JSCAGD.Vector3(i / this.n, this.d, 0));
		}
		this.topPoints.push(new JSCAGD.Vector3(1, -this.d, 0));
		this.P = P;
		this.controlNetType = 'curve';
	},

	function(u) {
		var N = JSCAGD.MeanBase.evalAllGeneral(this.n + 1, u, this.topPoints);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;

		for (i = 0; i <= this.n; i++) {
			C.addScaledVector(this.P[i], N[i]);
		}
		return C;
	}
);

JSCAGD.MeanCurve.prototype.setD = function(d) {
	this.d = d;
	//this.topPoints = [];
	var i;
	this.topPoints[0].y = -d;
	for (i = 0; i < this.n + 1; i++) {
		this.topPoints[i+1].y = d;
	}
	this.topPoints[this.n + 2].y = -d;
};

JSCAGD.MeanCurve.prototype.insertKnot = function(t) {
	this.n += 1;
	var i = this.findSpan(t);
	var before = this.topPoints[i].x;
	var next = this.topPoints[i + 1].x;
	var dist = next - before;
	var lm = (next - t) / dist;
	var newPoint = this.P[i - 1].clone();
	newPoint.multiplyScalar(lm);
	newPoint.addScaledVector(this.P[i], 1 - lm);
	this.topPoints.splice(i + 1, 0, new JSCAGD.Vector3(t, this.d, 0));
	this.P.splice(i, 0, newPoint);
};

JSCAGD.MeanCurve.prototype.findSpan = function(t) {
	if (t === 0) {
		return 1;
	}
	for (var i = 1; i < this.topPoints.length; i++) {
		if (this.topPoints[i].x > t) {
			return i - 1;
		}
	}
	if (t === 1) {
		return this.n;
	}
};






