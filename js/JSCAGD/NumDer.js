"use strict";

var JSCAGD = JSCAGD || {};


/**
 * Container for static Numerical derivative base functions 
 * @namespace
 */
JSCAGD.NumDer = {};


JSCAGD.NumDer.getTangent = function( getPoint ) {

	// Simple one step method
	return function( t ) {
		var delta = 0.0001;
		if (t===1) { t = t-delta; }
		if (t===0) { t = t+delta; }
			
		var t1 = t - delta;
		var t2 = t + delta;

		// Capping in case of danger

		if ( t1 < 0 ) t1 = 0;
		if ( t2 > 1 ) t2 = 1;

		var pt1 = getPoint( t1 );
		var pt2 = getPoint( t2 );

		var vec = pt2.clone().sub( pt1 );
		return vec.normalize();
	};

};


JSCAGD.NumDer.getCurvature = function( curve, t ) {

	// Calabi, Eugenio, Peter J. Olver, Chehrzad Shakiban and Steven Haker.
	// “Differential and Numerically Invariant Signature Curves Applied to Object Recognition.” 
	// International Journal of Computer Vision 26.2 (1998): 107-135
	//return function( t ) {
		var delta = 0.0001;
			if (t===1) { t = t-delta; }
			if (t===0) { t = t+delta; }
			
			var t1 = t - delta;
			var t2 = t + delta;

			// Capping in case of danger

			if ( t1 < 0 ) t1 = 0;
			if ( t2 > 1 ) t2 = 1;

			var pt0 = curve.getPoint( t1 );
			var pt1 = curve.getPoint( t );
			var pt2 = curve.getPoint( t2 );

			var a = pt0.clone().sub( pt1 );
			var b = pt2.clone().sub( pt1 );
			var c = pt2.clone().sub( pt0 );

			var detAB = 2 * (b.x * a.y - b.y * a.x);
			var abc = a.length() * b.length() * c.length();
			return detAB / abc;
		//};
		
};


JSCAGD.NumInt = {};


JSCAGD.NumInt.trapezoid = function(func, a, b, dx) {
	var n = ((b - a) / dx);
	var x0, x1, Ai, i;
	var area = 0;
	for (i = 1; i <= n; i++) {
		x0 = a+(i-1)*dx;
		x1 = a+i*dx;
		Ai = dx * (func(x0) + func(x1))/ 2.0;
		area += Ai;
	}
};











