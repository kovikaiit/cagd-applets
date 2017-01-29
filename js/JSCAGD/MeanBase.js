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
	var d = topPoints[1].y;
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
	//var corr = (1-d) * JSCAGD.BernsteinBase.eval(1, n-1, u) * (meanValues[0]) / 2;
	//meanValues[0] -= corr;
	//meanValues[1] += corr;

	//var corrn = (1-d) * JSCAGD.BernsteinBase.eval(n-2, n-1, u) * (meanValues[n-1]) / 2;
	//meanValues[n-1] -= corrn;
	//meanValues[n-2] += corrn;
	return meanValues;
};

JSCAGD.MeanBase.evalAllGeneralCorner = function(u, V) {
	var n = V.length / 2;
	var v = new THREE.Vector2(u, 0);
	var meanValues = JSCAGD.MeanValue.eval(V, v);
	var basis = [];
	for (var i = 0; i < n; i++) {
		basis[i] = meanValues[i] + meanValues[2 * n-i-1];
	}

	return basis;
};


JSCAGD.MeanBase.evalAllGeneralCorner2 = function(u, knot, d) {
	
	var n = knot.length;
	var i;
	var V0 = [];
	var d0 = 0.1;
	for (i = 0; i < n; i++) {
		if (i==0 || i==n-1) {
			V0.push(new JSCAGD.Vector2(knot[i], 0))
		} else {
			V0.push(new JSCAGD.Vector2(knot[i], 0.1*d));
		}
		
	}
	for (i = 0; i < n; i++) {
		if (i==0 || i==n-1) {
			V0.push(new JSCAGD.Vector2(knot[n-i-1], 0))
		} else {
			V0.push(new JSCAGD.Vector2(knot[n-i-1], -0.1*d));
		}
		
	}
	
	
	var v = new JSCAGD.Vector2(u, 0);
	var meanValues = JSCAGD.MeanValue.evalBuhera(V0, v);
	

	//var h = d *u *(1-u);
	//var Vd = [];
	//for (i = 0; i < n; i++) {
	//	Vd.push(new JSCAGD.Vector2(knot[i], h));
	//}
	//for (i = 0; i < n; i++) {
	//	Vd.push(new JSCAGD.Vector2(knot[n-i-1], -h));
	//}


	//var h = d *u *(1-u);
	//var Vd = [];
	//for (i = 0; i < n; i++) {
	//	Vd.push(new JSCAGD.Vector2(knot[i], d * meanValues[i]));
	//}
	//for (i = 0; i < n; i++) {
	//	Vd.push(new JSCAGD.Vector2(knot[n-i-1], - d * meanValues[n-i-1]));
	//}
	
	//var v1 = new JSCAGD.Vector2(u, 0);
	//var meanValues1 = JSCAGD.MeanValue.eval(Vd, v1);
	var basis1 = [];
	for (i = 0; i < n; i++) {
		basis1[i] = meanValues[i] + meanValues[2 * n-i-1];
	}
	return basis1;
};



JSCAGD.MeanBase.evalAllGeneralCorner3 = function(u, knot, d) {
	
	var n = knot.length;
	var i;
	var V0 = [];
	var d0 = 0.1;
	for (i = 0; i < n; i++) {
		if (i==0 || i==n-1) {
			V0.push(new JSCAGD.Vector2(knot[i], 0.1*d))
		} else {
			V0.push(new JSCAGD.Vector2(knot[i], 0.1*d));
		}
		
	}
	var v = new JSCAGD.Vector2(u, 0);

	var s = [];
	var r = [];
	var f = [];
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	if (u === 0) {
		f[0] = 1;
		return f;
	}
	if (u === 1) {
		f[n-1] = 1;
		return f;
	}
	for (i = 0; i < n; i++) {
		s[i] = V0[i].clone();
		s[i].addScaledVector(v, -1);
		r[i] = s[i].length();

	}
	
	
	
	//var meanValues = JSCAGD.MeanValue.evalBuhera(V0, v);
	var total = 0;
	var basis1 = [];	
	basis1[0] = (r[1]-r[0])+(r[0]/(u))/(n-1)/2 +(r[0]*r[0]/(u*u))/(n-1)/2;
	total += basis1[0];
	basis1[1] = (r[0] + r[2] - 2*r[1])+0.2*((d)/(u))/(n-1);
	total += basis1[1];
	for (i = 2; i < n-1; i++) {
		basis1[i] = (r[i-1] + r[i+1] - 2*r[i]);
		total += basis1[i];
	}
	basis1[n-1] = (r[n-2]-r[n-1])+r[n-1]/((1-u))/(n-1);
	total += basis1[n-1];
	for (i = 0; i < n; i++) {
		basis1[i] /= total;
	}
	return basis1;
};


JSCAGD.MeanBase.evalAllGeneralCorner4 = function(u, knot, d) {
	
	var n = knot.length;
	var i;
	var V0 = [];
	var d0 = 0.1;
	for (i = 0; i < n; i++) {
		if (i==0 || i==n-1) {
			V0.push(new JSCAGD.Vector2(knot[i], 0.1*d))
		} else {
			V0.push(new JSCAGD.Vector2(knot[i], 0.1*d));
		}
		
	}
	var v = new JSCAGD.Vector2(u, 0);

	var s = [];
	var r = [];
	var f = [];
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	if (u === 0) {
		f[0] = 1;
		return f;
	}
	if (u === 1) {
		f[n-1] = 1;
		return f;
	}
	for (i = 0; i < n; i++) {
		s[i] = V0[i].clone();
		s[i].addScaledVector(v, -1);
		r[i] = s[i].length();

	}
	
	var t = u;
	
	//var meanValues = JSCAGD.MeanValue.evalBuhera(V0, v);
	var total = 0;
	var basis1 = [];	
	var h0 = 1/(n-1);
	basis1[0] = (r[1] / (t*t) + (h0-t) / (t*t)) * h0 * h0;
	total += basis1[0];
	basis1[1] = (1/t + (h0-t) / (t*r[1])) * h0 * h0+ r[2]- (h0-t)* (2*h0-t)/r[1];

	total += basis1[1];
	for (i = 2; i < n-2; i++) {
		basis1[i] = (r[i-1] + r[i+1] - 2*r[i]);
		total += basis1[i];
	}
	basis1[n-2] =  (1/ (1-t) - ((n-2)*h0-t) / ((1-t)*r[n-2])) * h0 * h0+ r[n-3] - ((n-3)*h0-t)* ((n-2)*h0-t)/r[n-2];
	total += basis1[n-2];
	basis1[n-1] = (r[n-2] / ((1-t)*(1-t)) - ((n-2)*h0-t) / ((1-t)*(1-t)))* h0 * h0;
	total += basis1[n-1];
	for (i = 0; i < n; i++) {
		basis1[i] /= total;
	}
	return basis1;
};


JSCAGD.MeanBase.evalAllCyclic1 = function(u, n, d) {
	var k;
	var diff = 1/n;
	var i;
	var r = [];
	for(k = 0; k < 10; k++)
	{
		for (i = 0; i < n; i++) {
			var ptdist = ((-5+k)*n+i)*diff;
			r[k*n + i] = Math.sqrt((u-ptdist)*(u-ptdist) + d*d/100);
		}
	}
	

	var total = 0;
	var basis1 = [];
	for (i = 0; i < n; i++) {
		basis1[i] = 0;
	}
	for(k = 1; k < 9; k++)
	{
		for (i = 0; i < n; i++) {
			
			var index = k*n + i;
			var plus = r[index-1] + r[index+1] - 2*r[index];
			basis1[i] += plus;
			total  += plus;
		}
	}
	for (i = 0; i < n; i++) {
		basis1[i] /= total;
	}
	return basis1;
};


JSCAGD.MeanBase.evalAllCyclic2 = function(u, n, d) {
	var diff = 1/n;
	var i;
	d /= 10;
	var d2 = 10*d;

	var smooth_d = function(x, d) {
		return Math.sqrt(x*x + d * d);
	};

	var smooth_dd = function(x, d, max) {
		var rev = max - x; // 0.5 - x
		return  smooth_d(max, d) - smooth_d(rev, d);
	};

	var abs05i = function(x, i) {
		return 0.5 - Math.abs(0.5 - Math.abs(x - i* diff));
	};

	var basis1 = [];
	var total = 0;
	for (i = 0; i < n; i++) {	
		var ri = smooth_d(abs05i(u,i), d);
		var maxri = smooth_d(0.5, d);
		var plusi = smooth_d(abs05i(u,i)- diff, d) + smooth_d(abs05i(u,i) + diff, d);
		var maxplus = (smooth_d(0.5- diff, d) + smooth_d(0.5 + diff, d))/2;
		basis1[i] =  - smooth_dd(ri,d2, maxri) + smooth_dd(plusi/2, d2, maxplus);
		total  += basis1[i];
	}
	
	for (i = 0; i < n; i++) {
		basis1[i] /= total;
	}
	return basis1;
};



JSCAGD.MeanCurve = JSCAGD.ParametricCurve.create(
	function(P, n, d) {
		this.n = typeof n !== 'undefined' ? n : P.length - 1;
		this.d = typeof d !== 'undefined' ? d : 1 / (n + 1);
		this.topPoints = [];

		var i;
		//this.topPoints.push(new JSCAGD.Vector3(0, -this.d, 0));
		this.topPoints.push(new JSCAGD.Vector3(0, -0.00001, 0));
		for (i = 0; i < this.n + 1; i++) {
			this.topPoints.push(new JSCAGD.Vector3(i / this.n, this.d, 0));
		}
		this.topPoints.push(new JSCAGD.Vector3(1, -this.d, 0));
		//this.topPoints.push(new JSCAGD.Vector3(1, 0, 0));
		this.topPoints[1].y = 0.00001;
		//this.topPoints[n].y = 0.001;
		this.P = P;
		this.controlNetType = 'curve';

		this.V = [];
		for (i = 0; i < this.n + 1; i++) {
			this.V.push(new JSCAGD.Vector2(i / this.n, this.d));
		}
		for (i = 0; i < this.n + 1; i++) {
			this.V.push(new JSCAGD.Vector2((n - i) / this.n, -this.d));
		}

		this.knot = [];
		for (i = 0; i < this.n + 1; i++) {
			this.knot.push(i / this.n);
		}
	},

	function(u) {
		//var N = JSCAGD.MeanBase.evalAllGeneral(this.n + 1, u, this.topPoints);
		var N = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.knot, this.d);
		//var N = JSCAGD.MeanBase.evalAllCyclic2(u, this.n+1, this.d);
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

	this.V = [];
	for (i = 0; i < this.n + 1; i++) {
		this.V.push(new JSCAGD.Vector2(i / this.n, this.d));
	}
	for (i = 0; i < this.n + 1; i++) {
		this.V.push(new JSCAGD.Vector2((this.n - i) / this.n, -this.d));
	}
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






