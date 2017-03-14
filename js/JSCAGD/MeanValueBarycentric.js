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
	var f = [], s = [], r = [], A = [], D = [];
	var W = 0, i, i1, im1, w;

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
	var W1 = 1/W;
	for (i = 0; i < n; i++) {
		f[i] *= W1;
	}
	return f;
};


/**
 * Evaluate splitted Mean Value generalized barycentric coordinates 
 * @param  {List} V - Polygon
 * @param  {Vector} v - Planar point 
 * @return {List} -  Coordinates
 */
JSCAGD.MeanValue.evalSplitFP = function(V, v, sidemodA, sidemodB) {
	var n = V.length;
	var m = n/2;
	var f = [], fp = [], fm = [];
	var s = [];
	var r = [];
	var A = [];
	var D = [];
	var W = 0;
	var i, i1, im1, w;
	for (i = 0; i < n; i++) {
		f[i] = 0;
		fp[i] = 0;
		fm[i] = 0;
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
		wp = 0;
		wm = 0;
		i1 = (i + 1) % n;
		im1 = ((i - 1) % n + n) % n;
		if (A[im1] !== 0) {
			wm += (r[im1] - D[im1] / r[i]) / A[im1];
		}
		if (A[i] !== 0) {
			wp += (r[i1] - D[i] / r[i]) / A[i];
		}
		fm[i] = wp;
		fp[i] = wm;
		f[i] = wp + wm;
		W += wp + wm;
	}
	var W1 = 1/W;
	for (i = 0; i < n; i++) {
		fp[i] *= W1;
		fm[i] *= W1;
		f[i] *= W1;
	}
	return {f:f, fp: fp, fm: fm };
};


/**
 * Evaluate Wachspress generalized barycentric coordinates
 * @param  {List} V - Polygon
 * @param  {Vector} v - Planar point 
 * @return {List} -  Coordinates
 */
JSCAGD.MeanValue.evalWachspress = function(V, v) {
	var n = V.length;
	var f = [], s = [], g = [], r = [], A = [], D = [], B = [];
	var W = 0, i, i1, im1, w;

	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		s[i] = V[i].clone();
		s[i].addScaledVector(v, -1);
		im1 = ((i - 1) % n + n) % n;
		
		g[i] =  V[i].clone();
		g[i].addScaledVector(V[im1], -1);

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
		B[i] = (g[i].x * g[i1].y - g[i].y * g[i1].x) / 2;
		if (A[i] === 0 && D[i] < 0) {
			f[i] = r[i1] / (r[i] + r[i1]);
			f[i1] = r[i] / (r[i] + r[i1]);
			return f;
		}
	}
	for (i = 0; i < n; i++) {
		im1 = ((i - 1) % n + n) % n;
		w = B[i]/(A[im1]*A[i]);
		f[i] = w;
		W += w;
	}
	var W1 = 1/W;
	for (i = 0; i < n; i++) {
		f[i] *= W1;
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
	var total = 0,
		tmp;
	var l, theta;
	var d = [];
	var u = [];
	var tmpvec, h, c, s;
	var i, j, k;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		tmpvec = V[i].clone();
		tmpvec.addScaledVector(x, -1);
		d[i] = tmpvec.length();
		if (d[i] < JSCAGD.epsilon) {
			f[i] = 1;
			return f;
		}
		tmpvec.normalize();
		u[i] = tmpvec;
	}

	for (i = 0; i < T.length; i++) {
		l = [];
		c = [];
		s = [];
		theta = [];
		h = 0;
		for (k = 0; k < 3; k++) {
			tmpvec = u[T[i][(k + 1) % 3]].clone();
			tmpvec.addScaledVector(u[T[i][(k + 2) % 3]], -1);
			l[k] = tmpvec.length();
			theta[k] = 2 * Math.asin(Math.max(Math.min(l[k] / 2, 1), -1));

			h += theta[k];
		}
		h = h / 2;
		if (Math.abs(Math.PI - h) < JSCAGD.epsilon) {
			// x lies on T[i]
			for (k = 0; k < n; k++) {
				f[k] = 0;
			}
			f[T[i][0]] = Math.sin(theta[0]) * d[T[i][1]] * d[T[i][2]];
			f[T[i][1]] = Math.sin(theta[1]) * d[T[i][0]] * d[T[i][2]];
			f[T[i][2]] = Math.sin(theta[2]) * d[T[i][1]] * d[T[i][0]];
			total = f[T[i][0]] + f[T[i][1]] + f[T[i][2]];
			for (j = 0; j < n; j++) {
				f[j] /= total;
			}

			return f;
		}
		var detvec = u[T[i][0]].clone();
		detvec.cross(u[T[i][1]]);
		var det = detvec.dot(u[T[i][2]]);
		for (k = 0; k < 3; k++) {
			c[k] = (2 * Math.sin(h) * Math.sin(h - theta[k])) / (Math.sin(theta[(k + 1) % 3]) * Math.sin(theta[(k + 2) % 3])) - 1;
			s[k] = Math.sign(det) * Math.sqrt(Math.max(1 - c[k] * c[k], 0));
		}

		if (Math.abs(s[0]) < JSCAGD.epsilon || Math.abs(s[1]) < JSCAGD.epsilon || Math.abs(s[2]) < JSCAGD.epsilon) {
			continue;
		}

		for (k = 0; k < 3; k++) {
			var a = (d[T[i][k]] * Math.sin(theta[(k + 1) % 3]) * s[(k + 2) % 3]);
			tmp = (theta[k] - c[(k + 1) % 3] * theta[(k + 2) % 3] - c[(k + 2) % 3] * theta[(k + 1) % 3]) / a;
			f[T[i][k]] += tmp;
			total += tmp;
		}
	}

	var total1  = 1/total;
	for (i = 0; i < n; i++) {
		f[i] *= total1;
	}
	return f;
};



/**
 * Based on Geza Kos' personal letter
 * Evaluate Mean Value generalized barycentric coordinates in 3D for general poly mesh
 * @param  {List} V  - Vertices of the polytope	
 * @param  {List} T - Faces (trianlges)
 * @param  {Vector} v - 3D Point
 * @return {List}   Coordinates
 */
JSCAGD.MeanValue.evalPolyMesh = function(V, T, x) {
	var n = V.length;
	var f = [];
	var total = 0;
	var d = [];
	var u = [];
	var i, j, k, tmpvec;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		tmpvec = V[i].clone();
		tmpvec.addScaledVector(x, -1);
		d[i] = tmpvec.length();
		if (d[i] < JSCAGD.epsilon) {
			f[i] = 1;
			return f;
		}
		tmpvec.normalize();
		u[i] = tmpvec;
	}
	for (i = 0; i < T.length; i++) {
		var t = new JSCAGD.Vector3(0,0,0);
		k = T[i].length;
		for (j = 0; j < k; j++) 
		{
			var j1 = (j+1) % k;
			var OPj = u[T[i][j]];
			var OPj1 = u[T[i][j1]];
			var njj1 = new JSCAGD.Vector3();
			njj1.crossVectors(OPj, OPj1);
			njj1.normalize();
			var alphaj = Math.acos(OPj.dot(OPj1))/2;
			t.addScaledVector(njj1, alphaj);
		}
		var tnorm = t.length();
		t.normalize();

		var e = new JSCAGD.Vector3(1,0,0);
		if(Math.abs(t.z) < JSCAGD.epsilon && Math.abs(t.y) < JSCAGD.epsilon) {
			e.x = 0;
			e.y = 1;
		}
		var u0 = new JSCAGD.Vector3();
		u0.crossVectors(e, t);
		u0.normalize();
		var v0 = new JSCAGD.Vector3();
		v0.crossVectors(u0, t); 
		v0.normalize();

		var actual, scale;
		var points2D = [];
		var scales=[];
		for (j = 0; j < k; j++) 
		{
			scale = 1/t.dot(u[T[i][j]]);
			scales.push(scale);
			points2D.push(new JSCAGD.Vector2(u0.dot(u[T[i][j]])*scale, v0.dot(u[T[i][j]])*scale));
		}

		var vP = new JSCAGD.Vector2(0, 0);
		var f0;	
		f0 = JSCAGD.MeanValue.eval(points2D, vP);
			
		

		for (j = 0; j < k; j++) 
		{
			var plus = f0[j] * tnorm * scales[j] / d[T[i][j]];
			f[T[i][j]] += plus;
			total += plus;
		}
	}
	var total1  = 1/total;
	for (i = 0; i < n; i++) {
		f[i] *= total1;
	}
	return f;
};



/**
 * Evaluate Mean Value generalized barycentric coordinates in 3D for FP surfaces
 * @param  {List} V  - Vertices of the polytope	
 * @param  {List} T - Faces (trianlges)
 * @param  {Vector} v - 3D Point
 * @return {List}   Coordinates
 */
JSCAGD.MeanValue.evalPolyMeshFP = function(V, T, x) {
	var n = V.length;
	var f = [];
	var total = 0;
	var d = [];
	var u = [];
	var i, j, k, tmpvec;
	for (i = 0; i < n; i++) {
		f[i] = 0;
	}
	for (i = 0; i < n; i++) {
		tmpvec = V[i].clone();
		tmpvec.addScaledVector(x, -1);
		d[i] = tmpvec.length();
		if (d[i] < JSCAGD.epsilon) {
			f[i] = 1;
			return f;
		}
		tmpvec.normalize();
		u[i] = tmpvec;
	}

	var sideScaler = [4*(x.x), 4* x.y, 4*(1- x.x), 4*(1 - x.y)];

	for (i = 0; i < T.length; i++) {
		var t = new JSCAGD.Vector3(0,0,0);
		k = T[i].length;
		for (j = 0; j < k; j++) 
		{
			var j1 = (j+1) % k;
			var OPj = u[T[i][j]];
			var OPj1 = u[T[i][j1]];
			var njj1 = new JSCAGD.Vector3();
			njj1.crossVectors(OPj, OPj1);
			njj1.normalize();
			var alphaj = Math.acos(OPj.dot(OPj1))/2;
			t.addScaledVector(njj1, alphaj);
		}
		var tnorm = t.length();
		t.normalize();

		var e = new JSCAGD.Vector3(1,0,0);
		if(Math.abs(t.z) < JSCAGD.epsilon && Math.abs(t.y) < JSCAGD.epsilon) {
			e.x = 0;
			e.y = 1;
		}
		var u0 = new JSCAGD.Vector3();
		u0.crossVectors(e, t);
		u0.normalize();
		var v0 = new JSCAGD.Vector3();
		v0.crossVectors(u0, t); 
		v0.normalize();

		var actual, scale;
		var points2D = [];
		var scales=[];
		for (j = 0; j < k; j++) 
		{
			scale = 1/t.dot(u[T[i][j]]);
			scales.push(scale);
			points2D.push(new JSCAGD.Vector2(u0.dot(u[T[i][j]])*scale, v0.dot(u[T[i][j]])*scale));
		}

		var vP = new JSCAGD.Vector2(0, 0);
		var f0;
		if(typeof T[i].border !== undefined && T[i].border === false ) {
			f0 = JSCAGD.MeanValue.evalWachspress(points2D, vP);
			//console.log("border");
		} else {
			
			var bary = JSCAGD.MeanValue.evalSplitFP(points2D, vP);
			//for (var i = bary.f.length - 1; i >= 0; i--) {
				//if(i === 0 || i === bary.f.length - 1)
				
			//}
			f0 = bary.f; 
		}	
		

		for (j = 0; j < k; j++) 
		{
			var plus = f0[j] * tnorm * scales[j] / d[T[i][j]];
			for each (var side in T[i].sideNum) {
				plus /= sideScaler[side - 1]
			}
			f[T[i][j]] += plus;

			total += plus;
		}
	}
	var total1  = 1/total;
	for (i = 0; i < n; i++) {
		f[i] *= total1;
	}
	return f;
};