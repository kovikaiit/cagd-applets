"use stict";

load('JSCAGD/BaseFunctions.js');


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


var evalPBase = function(t, knot, d) {
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
		r[i] = Math.sqrt((knot[i] - t) * (knot[i] - t) + (d) * (d));
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

var trapezoid = function(func, a, b, dx) {
	var n = ((b - a) / dx);
	var x0, x1, Ai, i;
	var area = 0;
	for (i = 1; i <= n; i++) {
		x0 = a + (i-1)*dx;
		x1 = a + i*dx;
		Ai = dx * (func(x0) + func(x1))/ 2.0;
		area += Ai;
	}
	return area;
};




var n = 6;
var knot = [];
for (i = 0; i <= n ; i++) {
	knot.push(i / n);
}



var pfunc = function(i, d) { return function(t) {
	return evalPBase(t, knot, d)[i];
}; };

var bernsteinfunc = function(i) { return function(t) {
	return JSCAGD.BernsteinBase.eval(i, n, t);
}; };

var bsplinefunc = function(i, p) { return function(t) {
	var U = JSCAGD.KnotVector.createUniform(n, p);
	span = JSCAGD.KnotVector.findSpan(U, n, p, t);
	if (span - p  <=  i && i <= span) {
		return JSCAGD.BsplineBase.evalNonWanish(U, n, p, t, span)[i - span + p];
	} else {
		return 0;
	}
}; };

debug(evalPBase(0.2, knot, 0.02));
//debug(pfunc(2)(0.5));
var delta = 0.0001;

var locality = function(func, t, w) {
	return trapezoid(func, t-w, t+w, delta)/trapezoid(func, 0, 1, delta);
};
var localityMiddle = function(func) {
	return locality(func, 0.5, 1/n);
};

debug("Maximums (n=6):")
debug("Bezier: " + bernsteinfunc(3)(0.5));
debug("B-spline (p=2): " + bsplinefunc(3,2)(0.5));
debug("B-spline (p=3): " + bsplinefunc(3,3)(0.5));
debug("B-spline (p=4): " + bsplinefunc(3,4)(0.5));
debug("P-curve (gamma=0.04): " + pfunc(3, 0.04)(0.5));
debug("P-curve (gamma=0.08): " + pfunc(3, 0.08)(0.5));
debug("P-curve (gamma=0.14): " + pfunc(3, 0.14)(0.5));
debug("P-curve (gamma=0.20): " + pfunc(3, 0.2)(0.5));
debug("-----------------")
debug("Locality (n=6), in 0.5-1/n < t < 0.5+1/n strip:")
debug("Bezier: " + localityMiddle(bernsteinfunc(3)));
debug("B-spline (p=2): " + localityMiddle(bsplinefunc(3,2)));
debug("B-spline (p=3): " + localityMiddle(bsplinefunc(3,3)));
debug("B-spline (p=4): " + localityMiddle(bsplinefunc(3,4)));
debug("P-curve (gamma=0.04): " + localityMiddle(pfunc(3, 0.04)));
debug("P-curve (gamma=0.08): " + localityMiddle(pfunc(3, 0.08)));
debug("P-curve (gamma=0.14): " + localityMiddle(pfunc(3, 0.14)));
debug("P-curve (gamma=0.20): " + localityMiddle(pfunc(3, 0.2)));

