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













