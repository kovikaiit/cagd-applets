"use strict";

var JSCAGD = JSCAGD || {};

/**
 * Container for static test base functions 
 * @namespace
 */
JSCAGD.MeanBase = {};

var getSide = function(u, n) {
	var i;
	var basis = [];
	for (i = 0; i < n; i++) {
		basis[i] = 0;
	}
	if (u === 0) {
		basis[0] = 1;
		return basis;
	} else {
		basis[n - 1] = 1;
		return basis;
	}
	return basis;
};

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
	var r = [];
	var b = [];
	var total = 0;
	var basis = [];
	if(u===1 || u === 0) {
		return getSide(u, n);
	}
	for (i = 0; i < n; i++) {
		r[i] = Math.sqrt((knot[i] - u) * (knot[i] - u) + (0.1 * d) * (0.1 * d));
		if (i !== n - 1) {
			b[i] = 1 / (knot[i + 1] - knot[i]);
		}
	}
	basis[0] = (r[1] * b[0] - r[0] * b[0]) + r[0] / u;
	total += basis[0];
	basis[1] = (r[0] * b[0] + r[2] * b[1] - (b[0] + b[1]) * r[1]);
	total += basis[1];
	for (i = 2; i < n - 1; i++) {
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

JSCAGD.MeanBase.evalAllGeneralCorner4 = function(t, knot, d) {
	var n = knot.length;
	var i;
	var r = [];
	var b = [];
	var total = 0;
	var basis = [];
	if (t === 1 || t === 0) {
		return getSide(t, n);
	}
	for (i = 0; i < n; i++) {
		r[i] = Math.sqrt((knot[i] - t) * (knot[i] - t) + (0.1 * d) * (0.1 * d));
		if (i !== n - 1 && (knot[i + 1] - knot[i]) !== 0) {
			b[i] = 1 / (knot[i + 1] - knot[i]);
		} else {
			b[i] = 0;
		}
	}
	basis[0] = (r[1] + (knot[1] - t)) / b[0] / (t * t) ;
	total += basis[0];
	basis[1] = (1 / t + (knot[1] - t) / (t * r[1])) / b[0]+ r[2] * b[1] - r[1] * b[1] - (knot[1] - t) / r[1];
	if (b[1] === 0) {
			basis[1] += (knot[1] - t) / r[1];
		}
	total += basis[1];
	for (i = 2; i < n - 2; i++) {
		basis[i] = (r[i - 1] * b[i - 1] + r[i + 1] * b[i] - (b[i - 1] + b[i]) * r[i]);
		if(b[i-1] === 0) {
			basis[i] -= (knot[i] - t) / r[i];
		} 
		if (b[i] === 0) {
			basis[i] += (knot[i] - t) / r[i];
		}
		total += basis[i];
	}
	basis[n - 2] = (1 / (1 - t) - (knot[n - 2] - t) / ((1 - t) * r[n - 2])) / b[n - 2] + r[n - 3] * b[n - 3] - r[n - 2] * b[n - 3] + (knot[n - 2] - t) / r[n - 2]; 
	if ( b[n - 3] === 0) {
		basis[n - 2] -= (knot[n - 2] - t) / r[n - 2]; 
	}
	total += basis[n - 2];
	basis[n - 1] = (r[n - 2] / ((1 - t) * (1 - t)) - (knot[n - 2] - t) / ((1 - t) * (1 - t))) / b[n - 2];
	total += basis[n - 1];
	for (i = 0; i < n; i++) {
		basis[i] /= total;
	}
	return basis;
};

JSCAGD.MeanBase.evalAllGeneralCorner5 = function(t, knot, d) {
	var n = knot.length;
	var i;
	var r = [];
	var b = [];
	var total = 0;
	var basis = [];
	if (t === 1 || t === 0) {
		return getSide(t, n);
	}
	for (i = 0; i < n; i++) {
		r[i] = Math.sqrt((knot[i] - t) * (knot[i] - t) + (0.1 * d) * (0.1 * d));
		if (i !== n - 1) {
			b[i] = 1 / (knot[i + 1] - knot[i]);
		}
	}
	//basis[0] = r[1] *b[0]-r[0]*b[0]+  r[0] / t+(r[1] + (knot[1] - t)) * b[0] / (t * t) /100;
	//var f0 = r[0]*r[0]/(t*t);
	//var f0 = (r[0] - t)/(t*t)/n;
	//var f0 = (r[1] + (knot[1] - t)) / (t * t) / (n-1);
	//var f0 = r[0]*(1 - t/r[0] )/(t*t)/10;
	//var f1 = (1 / t + (knot[1] - t) / (t * r[1]))/ (n-1);
	var fn = d*(1 - (1-t) / r[n-1])/((1-t)*(1-t))/100;
	//var fn = (1+d)*(1 - (1-t) / r[n-1])/((1-t)*(1-t))/10;

	//basis[0] = r[1] *b[0]-r[0]*b[0] +(r[0]/t )/t/(n-1);//+  r[0] / t /2;
	
	//basis[1] = r[2] * b[1] - r[1] * b[1] - (knot[1] - t) / r[1] + ((knot[1] - t) / r[1] /t/(n-1) - r[1] * b[0] + r[0] * b[0]); 
	//basis[1] = (1 / t + (knot[1] - t) / (t * r[1])) * b[0] /100 + r[2] * b[1] - r[1] * (b[1]+b[0]) +r[0]*b[0];// - (knot[1] - t) / r[1];
	

	//basis[0] = (r[1] + (knot[1] - t)) /(n-1) / (t * t) ;
	//total += basis[0];
	//basis[1] = (1 / t + (knot[1] - t) / (t * r[1])) / (n-1) + r[2] * b[1] - r[1] * b[1] - (knot[1] - t) / r[1];
	//total += basis[1];
	basis[0] = (r[1] + (knot[1] - t)) / b[0] / (t * t) ;
	basis[0] *= knot[2]/t;
	total += basis[0];
	basis[1] = (1 / t + (knot[1] - t) / (t * r[1])) / b[0]+ r[2] * b[1] - r[1] * b[1] - (knot[1] - t) / r[1];
	basis[1] *= knot[2]/t;
	total += basis[1];
	basis[2] = (r[1] -r[2]) * b[1] +(knot[2] -t)/r[2];//  + 
	basis[2] *= knot[2]/t;
	basis[2] += -(knot[2] -t)/r[2] + (r[3] -r[2]) * b[2] ;
	total += basis[2];
	for (i = 3; i < n - 2; i++) {
		basis[i] = (r[i - 1] * b[i - 1] + r[i + 1] * b[i] - (b[i - 1] + b[i]) * r[i]);
		total += basis[i];
	}
	basis[n - 2] = (1 / (1 - t) - (knot[n - 2] - t) / ((1 - t) * r[n - 2])) / b[n - 2] + r[n - 3] * b[n - 3] - r[n - 2] * b[n - 3] + (knot[n - 2] - t) / r[n - 2]; 
	total += basis[n - 2];
	basis[n - 1] = (r[n - 2] / ((1 - t) * (1 - t)) - (knot[n - 2] - t) / ((1 - t) * (1 - t))) / b[n - 2];
	total += basis[n - 1];
	for (i = 0; i < n; i++) {
		basis[i] /= total;
	}
	return basis;
};


JSCAGD.MeanBase.evalAllGeneralCorner5_TEST = function(t, U, d) {
	var n = U.length-1;
	var i;
	var r = [];
	var f = [];
	var total = 0;
	var w = [];
	var basis = [];
	var c1, cnm1, W, b1, bnm1;
	d /= 10;
	if (t === 1 || t === 0) {
		return getSide(t, n+1);
	}


	for (i = 1; i <= n-1; i++) { //i=1
		r[i] = Math.sqrt((U[i] - t) * (U[i] - t) + d*d);
	}
	for (i = 1; i <= n-2; i++) {
		if((U[i + 1] - U[i]) !== 0) {
			f[i] = (r[i+1] - r[i]) / (U[i + 1] - U[i]);
		} else {
			f[i] = (U[i] - t)/r[i];
		} 
	}
	b1 = U[1] * (r[1] + U[1] - t) / t;
	w[0] = b1/t;
	c1 =  (b1 - U[1] + t)/r[1];
	w[1] = c1 + f[1];
	for (i = 2; i <= n-2; i++) {
		w[i] = f[i] - f[i-1];
	}
	bnm1 = (1- U[n-1])*(r[n-1] - U[n-1] + t )/(1-t);
	cnm1 = (bnm1 + U[n-1] - t )/r[n-1];
	w[n-1] = cnm1 - f[n-2];
	w[n] = bnm1 /(1-t);
	W = w[0] + c1 + cnm1 + w[n];
	for (i = 0; i <= n; i++) {
		w[i] /= W;
	}
	return w;


};



JSCAGD.MeanBase.evalAllGeneralCorner5_TEST_tmp = function(t, U, d) {
	var n = U.length-1;
	var i;
	var r = [];
	var f = [];
	var total = 0;
	var w = [];
	var basis = [];
	var c1, cnm1, W;
	d /= 10;
	if (t === 1 || t === 0) {
		return getSide(t, n);
	}



	for (i = 0; i <= n-1; i++) { //i=1
		r[i] = Math.sqrt((U[i] - t) * (U[i] - t) + d*d);
	}
	for (i = 0; i <= n-2; i++) {
		if((U[i + 1] - U[i]) !== 0) {
			f[i] = (r[i+1] - r[i]) / (U[i + 1] - U[i]);
		} else {
			f[i] = 0;
		} 
	}
	w[0] = U[1] * (r[1] + U[1] - t)/(t*t);
	c1 =  U[1] * (r[1] + U[1] - t)/(t*r[1]);
	if (f[1] !== 0) {
		c1 -= (U[1] - t)/r[1];
	}
	w[1] = c1 + f[1];
	for (i = 2; i <= n-2; i++) {
		w[i] = f[i] - f[i-1];
		if (f[i] === 0) {
			w[i] += (U[i] - t)/r[i];
		}
		if (f[i - 1] === 0) {
			w[i] -= (U[i] - t)/r[i];
		}
	}
	cnm1 = (1- U[n-1])*(r[n-1] - U[n-1] + t )/((1-t) * r[n-1]);
	if (f[n-2] !== 0) {
		cnm1 += (U[n-1] - t)/r[n-1];
	}
	w[n-1] = cnm1 - f[n-2];
	w[n] = (1- U[n-1])*(r[n-1] - U[n-1] + t) /((1-t) * (1-t));
	W = w[0] + c1 + cnm1 + w[n];
	for (i = 0; i <= n; i++) {
		w[i] /= W;
	}
	return w;


};




JSCAGD.MeanBase.evalAllGeneralCorner6 = function(t, knot, d) {
	var n = knot.length;
	var i;
	var r = [];
	var b = [];
	var total = 0;
	var basis = [];
	if (t === 1 || t === 0) {
		return getSide(t, n);
	}
	for (i = 0; i < n; i++) {
		r[i] = Math.sqrt((knot[i] - t) * (knot[i] - t) + (0.1 * d) * (0.1 * d));
		if (i !== n - 1) {
			b[i] = 1 / (knot[i + 1] - knot[i]);
		}
	}
	basis[0] = r[1] *b[0]-r[0]*b[0]+  r[0] / t+(r[1] + (knot[1] - t)) * b[0] / (t * t) /100;
	var f0 = d*(1 - t/r[0] )/(t*t)/100;
	var f1 = t *f0;
	var fn = (1 - (1-t) / r[n-1])/((1-t)*(1-t))/d/10;
	//basis[0] = r[1] *b[0]-r[0]*b[0]+  r[0] / t + f0 - b[0]*f1;
	total += basis[0];
	//basis[1] = b[0]*f1 + r[2] * b[1] - r[1] * (b[1]+b[0]) +r[0]*b[0];
	basis[1] = (1 / t + (knot[1] - t) / (t * r[1])) * b[0] /100 + r[2] * b[1] - r[1] * (b[1]+b[0]) +r[0]*b[0];// - (knot[1] - t) / r[1];
	total += basis[1];
	for (i = 2; i < n - 2; i++) {
		basis[i] = (r[i - 1] * b[i - 1] + r[i + 1] * b[i] - (b[i - 1] + b[i]) * r[i]);
		total += basis[i];
	}
	basis[n - 2] = b[n-2]*(1-t)*fn;
	basis[n - 2] += r[n - 3] * b[n - 3] - r[n - 2] * (b[n - 3]+b[n-2]) +r[n-1]* b[n - 2]; 
	total += basis[n - 2];
	basis[n - 1] = (r[n - 2] * b[n - 2] - r[n - 1] * b[n - 2]) + r[n - 1] / (1 - t);
	basis[n - 1] += fn - b[n-2]*(1-t)*fn;
	total += basis[n - 1];
	for (i = 0; i < n; i++) {
		basis[i] /= total;
	}
	return basis;
};

JSCAGD.MeanBase.evalAllCyclic1 = function(u, n, d) {
	var k;
	var diff = 1/n;
	var i;
	var r = [];
	for(k = 0; k < 10; k++) {
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
	for(k = 1; k < 9; k++) {
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
		this.n = typeof n !== 'undefined' ? n : P.length -1;
		this.d = typeof d !== 'undefined' ? d : 1 / (n + 1);
		this.p = 3;
		this.U = JSCAGD.KnotVector.createUniform(this.n, this.p);
		this.W = [];
		for (var i = 0; i <= this.n; i++) {
			this.W.push(1);
		}
		//this.W[0] = 0.01;
		this.W[this.n] = this.W[0];
		//this.W[1] = 0.1;
		this.W[this.n-1] = this.W[1];
		var i;

		this.P = P;
		this.controlNetType = 'curve';

		this.knot = [];
		for (i = 0; i < this.n + 1; i++) {
			this.knot.push(i / this.n);
		}

		this.curvetype = 'B-spline';
	},

	function(u) {
		//var N = JSCAGD.MeanBase.evalAllGeneral(this.n + 1, u, this.topPoints);
		var N;
		if(this.curvetype === 'meang1test') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner5_TEST(u, this.knot, this.d);
		} else if (this.curvetype === 'meang1' || this.curvetype === 'P-curve') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.knot, this.d);
		} else if (this.curvetype === 'meang0') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner3(u, this.knot, this.d);
		} else if (this.curvetype === 'cyclicInf') {
			N = JSCAGD.MeanBase.evalAllCyclic1(u, this.n+1, this.d);
		} else if (this.curvetype === 'cyclicTricky') {
			N = JSCAGD.MeanBase.evalAllCyclic2(u, this.n+1, this.d);
		}	else if (this.curvetype === 'B-spline' || this.curvetype === 'Bézier') {
			var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
			N = JSCAGD.BsplineBase.evalNonWanish(this.U, this.n, this.p, u, span);
		} else if (this.curvetype === 'ratBezier') {
			
			N = JSCAGD.BernsteinBase.evalAllRational(this.n, this.W, u);
		}
		
		//var N = JSCAGD.MeanBase.evalAllCyclic2(u, this.n+1, this.d);
		var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
		var i;
		if (this.curvetype === 'B-spline' || this.curvetype === 'Bézier') {
			var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
			for (i = 0; i <= this.p; i++) {
				C.addScaledVector(this.P[span - this.p + i], N[i]);
			}
		} else {
			for (i = 0; i <= this.n; i++) {
				C.addScaledVector(this.P[i], N[i]);
			}
		}
		return C;
	}
);

JSCAGD.MeanCurve.prototype.setD = function(d) {
	this.d = d;
};

JSCAGD.MeanCurve.prototype.insertKnot = function(t) {
	
	var i = this.findSpan(t);
	var before = this.knot[i];
	var next = this.knot[i + 1];
	var dist = next - before;
	var lm = (next - t) / dist;
	var newPoint = this.P[i].clone();
	newPoint.multiplyScalar(lm);
	newPoint.addScaledVector(this.P[i+1], 1 - lm);
	this.knot.splice(i + 1, 0, t);
	this.P.splice(i+1, 0, newPoint);
	this.n += 1;
	return i+1;
};

JSCAGD.MeanCurve.prototype.findSpan = function(t) {
	if (t === 0) {
		return 1;
	}
	for (var i = 1; i < this.knot.length; i++) {
		if (this.knot[i] > t) {
			return i-1;
		}
	}
	if (t === 1) {
		return this.n;
	}
};


JSCAGD.MeanCurve.prototype.PointOnPSurface = function(PTS, u, v) {
	Bu = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.knot, this.d);
	Bv = JSCAGD.MeanBase.evalAllGeneralCorner4(v, this.knot, this.d);
	var C = new THREE.Vector3(0.0, 0.0, 0.0);
	for (k = 0; k <= n; k++) 
	{
		for (l = 0; l <= m; l++) 
		{
			C.addScaledVector(PTS[k][l], Bu[k]*Bv[l]);
		}
	}
	return C;
};


JSCAGD.MeanCurve.prototype.setU = function(U) {
	this.U = U;
};

JSCAGD.MeanCurve.prototype.setDegree = function(p) {
	this.p = p;
	this.U = JSCAGD.KnotVector.createUniform(this.n, this.p);
};


JSCAGD.MeanCurve.prototype.elevateDegree = function() {
	var Q = [];
	Q[0] = this.P[0].clone();
	for (var i = 1; i <= this.n; i++) {
		Q[i] = this.P[i-1].clone();
		Q[i].multiplyScalar(i/(this.n+1))
		Q[i].addScaledVector(this.P[i], 1 - i/(this.n+1));
	}
	Q[this.n+1] = this.P[this.n].clone();
	this.n += 1;
	this.setDegree(this.p + 1);
	this.P = Q;
	this.knot = [];
	for (i = 0; i < this.n + 1; i++) {
		this.knot.push(i / this.n);
	}
};

JSCAGD.MeanCurve.prototype.reduceDegree = function() {
	var Q = [];
	var nui;
	var i;
	Q[0] = this.P[0].clone();
	Q[this.n-1] = this.P[this.n].clone();
	for (i = 1; i <= (this.n-1)/2 ; i++) {
		nui = i / this.n;
		Q[i] = this.P[i].clone();
		Q[i].addScaledVector(Q[i-1], -nui);
		Q[i].multiplyScalar(1/(1-nui));
	}
	for (i = this.n - 1; i > this.n/2; i--) {
		nui = i / this.n;
		Q[i-1] = this.P[i].clone();
		Q[i-1].addScaledVector(Q[i], -(1-nui));
		Q[i-1].multiplyScalar(1/nui);
	}
	this.n -= 1;
	this.setDegree(this.p - 1);
	
	this.P = Q;
	this.knot = [];
	for (i = 0; i < this.n + 1; i++) {
		this.knot.push(i / this.n);
	}
};






JSCAGD.MeanCurve.prototype.getDerivBS = function(d, u) {
	var span = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var der = JSCAGD.BsplineBase.evalNonWanishDer(this.U, this.n, this.p, u, span);
	var C = new JSCAGD.Vector3(0.0, 0.0, 0.0);
	var i;
	for (i = 0; i <= this.p; i++) {
		C.addScaledVector(this.P[span - this.p + i], der[d][i]);
	}
	return C;
};

JSCAGD.MeanCurve.prototype.getAllDerivBS = function(d, u) {
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


JSCAGD.MeanCurve.prototype.getTangentBS = function(u) {
	var deriv = this.getDerivBS(1, u);
	deriv.normalize();
	return deriv;
};


JSCAGD.MeanCurve.prototype.getNormalBS = function(u) {
	//var tangent = this.getTangentBS(u);
	//var deriv2 = this.getDerivBS(2, u);
	//var dot = deriv2.dot(tangent);
	//deriv2.addScaledVector(tangent, -dot);
	//deriv2.normalize();
	//return deriv2;
	var derivs = this.getAllDerivBS(2, u);

	// tangent
	derivs[1].normalize();

	// normal
	var dot = derivs[2].dot(derivs[1]);
	derivs[2].addScaledVector(derivs[1], -dot);
	derivs[2].normalize();
	return  derivs[2];
};


JSCAGD.MeanCurve.prototype.getBinormalBS = function(u) {
	var tangent = this.getTangentBS(u);
	var normal = this.getNormalBS(u);
	var b = new JSCAGD.Vector3();
	return b.crossVectors(tangent, normal);
};


JSCAGD.MeanCurve.prototype.getFrenetFrame = function(u) {
	var derivs = this.getAllDerivBS(2, u);

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


JSCAGD.MeanCurve.prototype.insertKnotBS = function(u) {
	var k = JSCAGD.KnotVector.findSpan(this.U, this.n, this.p, u);
	var r = 1;
	var s = 0;
	for (var i = 0; i < this.U.length; i++) {
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

	var i, j, L;

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
			//Rw[i] = alpha * Rw[i + 1] + (1.0 - alpha) * Rw[i]; // vector type !!!
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

	this.knot = [];
	for (i = 0; i < this.n + 1; i++) {
		this.knot.push(i / this.n);
	}
};


