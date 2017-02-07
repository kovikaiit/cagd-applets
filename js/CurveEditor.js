
"use strict";

/* globals JSCAGD */
/* globals THREE */

var is2D = true;
var is3D = !is2D;

var curveParameters = {
		material: new THREE.MeshLambertMaterial({
			color: 0x000bbb,
			shading: THREE.SmoothShading
		}),

		movingpointmaterial: new THREE.MeshLambertMaterial({
			color: 0x2e9800,
			shading: THREE.SmoothShading
		}),

		knotpointmaterial: new THREE.MeshLambertMaterial({
			color: 0x2fa1d6,
			shading: THREE.SmoothShading
		}),

		curvfencematerial:  new THREE.LineBasicMaterial( { 
			color: 0x2e9800, 
			linewidth: 1 
		}),

		tuberadius: 2,

		arrowLength: 200,

		fenceResolution: 600,

		curveResolution: 300
};

function getCircleOrig(curve, t) {
	//if (t===1) { t = 0.99; }
	//if (t===0) { t = 0.005; }
	var tan = curve.getTangent(t);
	var normal = new JSCAGD.Vector3(tan.y, -tan.x, 0);
	var radius = -1/JSCAGD.NumDer.getCurvature(curve, t);
	if(is3D && (curve.curvetype === 'Bézier' || curve.curvetype === 'B-spline') ) {
			//normal = new JSCAGD.Vector3(0, 0, 0);
			normal = curve.getNormalBS(t);
			radius = Math.abs(radius);
	}
	var curvepoint = curve.getPoint(t);
	var fencepoint = curvepoint.clone();
	
	fencepoint.add(new THREE.Vector3(radius*normal.x, radius*normal.y, radius*normal.z));

	return fencepoint;
}


// Curve drawing and edit/update handler

var CurveEditor = function(curve) {

	THREE.Object3D.call(this);

	this.curve = curve;
	this.curve.dynamic = true;

	this.tube = new THREE.TubeGeometry(
		this.curve, //path
		curveParameters.curveResolution, //segments
		curveParameters.tuberadius, //radius
		8, //radiusSegments
		false //closed
	);

	this.tubeMesh = new THREE.Mesh(this.tube, curveParameters.material);
	this.tubeMesh.dynamic = true;

	this.curve.needsUpdate = true;
	this.tube.verticesNeedUpdate = true;
	this.tubeMesh.verticesNeedUpdate = true;

	this.add(this.tubeMesh);

	this.t = 0.5;
	this.d = 0.2;
	
	this.showPoint = false;
	this.showCurv = false;
	this.showFrame = false;
	this.showCirc = false;
	this.showKnots = false;


	var pos = this.curve.getPoint(this.t);
	var mvPointGeometry = new THREE.SphereGeometry(10, 32, 32);
	this.curvePoint = new THREE.Mesh(mvPointGeometry, curveParameters.movingpointmaterial);
	this.curvePoint.position.set(pos.x, pos.y, pos.z);


	this.knotPoints = new THREE.Object3D();
	this.knotPointsList = [];

	this.reset();


    var curvature = JSCAGD.NumDer.getCurvature(this.curve, this.t);
	this.osculatingCir =  new THREE.TorusGeometry( 1/curvature, 1, 16, 100 );

	this.torus = new THREE.Mesh( this.osculatingCir, curveParameters.movingpointmaterial );
	var orig = getCircleOrig(this.curve, this.t);
	this.torus.position.set(orig.x, orig.y, orig.z);

	if (this.showCirc) {
		this.add(this.torus);
	}

	if (this.showPoint) {
		this.add(this.curvePoint);
	}

	var frenetFrame = this.curve.getFrenetFrame(this.t);

	this.tArrow = new THREE.ArrowHelper(frenetFrame.tangent, pos, curveParameters.arrowLength, 0x000000);
	this.nArrow = new THREE.ArrowHelper(frenetFrame.normal, pos, curveParameters.arrowLength, 0x000000);
	this.bArrow = new THREE.ArrowHelper(frenetFrame.binormal, pos, curveParameters.arrowLength, 0x000000);

	if (this.showFrame) {
		this.add(this.tArrow);
		this.add(this.nArrow);
		this.add(this.bArrow);
	}


	this.curvatureFence = new THREE.Object3D();
	this.fenceLines = [];
	var ti = 0;
 	var diff = 1/curveParameters.fenceResolution;
 	var i;
	for (i = 0; i < curveParameters.fenceResolution-1; i++) {
		var tan = this.curve.getTangent(ti);
		var normal = new JSCAGD.Vector3(tan.y, -tan.x, 0);
		curvature = Math.max(Math.min(20*JSCAGD.NumDer.getCurvature(this.curve, ti), 2),-2);
		if(is3D && (this.curve.curvetype === 'Bézier' || this.curve.curvetype === 'B-spline') ) {
			//normal = new JSCAGD.Vector3(0, 0, 0);
			normal = this.curve.getNormalBS(ti);
			curvature = -Math.abs(curvature);
		}

		var curvepoint = this.curve.getPoint(ti);
		var fencepoint = curvepoint.clone();
		
		fencepoint.add(new THREE.Vector3(curvature*100*normal.x, curvature*100*normal.y, curvature*100*normal.z));

		var bgeometry = new THREE.BufferGeometry();

		var positions = new Float32Array( 2 * 3 ); // 3 vertices per point
		bgeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		
		var line = new THREE.Line( bgeometry,  curveParameters.curvfencematerial );
		positions = line.geometry.attributes.position.array;
		positions[0] = curvepoint.x;
		positions[1] = curvepoint.y;
		positions[2] = curvepoint.z;

		positions[3] = fencepoint.x;
		positions[4] = fencepoint.y;
		positions[5] = fencepoint.z;

		this.curvatureFence.add(line);
		this.fenceLines[i] = line;
		ti += diff;
	}
	if (this.showCurv) {
		this.add(this.curvatureFence);
	}
};

CurveEditor.prototype = Object.create(THREE.Object3D.prototype);

CurveEditor.prototype.constructor = CurveEditor;

CurveEditor.prototype.update = function() {
	this.curve.needsUpdate = true;
	this.tube = new THREE.TubeGeometry(
		this.curve, //path
		curveParameters.curveResolution, //segments
		curveParameters.tuberadius, //radius
		8, //radiusSegments
		false //closed
	);

	this.tube.dynamic = true;
	this.tubeMesh.geometry.dispose();
	this.tubeMesh.geometry = this.tube;
	this.tubeMesh.geometry.verticesNeedUpdate = true;
	this.tubeMesh.verticesNeedUpdate = true;

	var ti = 0;
	var diff =1/curveParameters.fenceResolution;
	for (var i = 0; i < curveParameters.fenceResolution-1; i++) {
		ti += diff;
		var tan = this.curve.getTangent(ti);
		var normal = new JSCAGD.Vector3(tan.y, -tan.x, 0);
		var curvature = Math.max(Math.min(20*JSCAGD.NumDer.getCurvature(this.curve, ti), 2),-2);
		if(is3D && (this.curve.curvetype === 'Bézier' || this.curve.curvetype === 'B-spline') ) {
			normal = this.curve.getNormalBS(ti);
			curvature = -Math.abs(curvature);
		}

		var curvepoint = this.curve.getPoint(ti);
		var fencepoint = curvepoint.clone();
		
		fencepoint.add(new THREE.Vector3(curvature*100*normal.x, curvature*100*normal.y, curvature*100*normal.z));

		
		var line = this.fenceLines[i];
		var positions = line.geometry.attributes.position.array;
		positions[0] = curvepoint.x;
		positions[1] = curvepoint.y;
		positions[2] = curvepoint.z;

		positions[3] = fencepoint.x;
		positions[4] = fencepoint.y;
		positions[5] = fencepoint.z;
		line.geometry.attributes.position.needsUpdate = true; 
		
	}

};

CurveEditor.prototype.updateCurvePoint = function() {
	var pos = this.curve.getPoint(this.t);

	if (this.showPoint) {
		this.curvePoint.position.set(pos.x, pos.y, pos.z);
	}
	if (this.showFrame) {
		var frenetFrame = this.curve.getFrenetFrame(this.t);

		this.tArrow.position.copy(pos);
		this.tArrow.setDirection(frenetFrame.tangent);

		this.nArrow.position.copy(pos);
		this.nArrow.setDirection(frenetFrame.normal);

		this.bArrow.position.copy(pos);
		this.bArrow.setDirection(frenetFrame.binormal);
	}

	if (this.showCirc) {
		var curvature = JSCAGD.NumDer.getCurvature(this.curve, this.t);
		this.osculatingCir =  new THREE.TorusGeometry( 1/curvature, 1, 16, 100 );
		this.torus.geometry.dispose();
		this.torus.geometry = this.osculatingCir;
		var orig = getCircleOrig(this.curve, this.t);
		this.torus.position.set(orig.x, orig.y, orig.z);

		if(is3D && (this.curve.curvetype === 'Bézier' || this.curve.curvetype === 'B-spline') ) {
			var binormal = this.curve.getBinormalBS(this.t);
			orig.add(binormal);
			this.torus.lookAt(orig);
		}
	}
	if (this.showKnots) {
		
		for (var i = this.knotlist.length - 1; i >= 0; i--) {
			var ti = this.knotlist[i];
			pos = this.curve.getPoint(ti);
			var pt = this.knotPointsList[i];
			pt.position.set(pos.x, pos.y, pos.z);
		}
		
	}

};

CurveEditor.prototype.setShow = function() {
	var pos = this.curve.getPoint(this.t);
	if (this.showPoint) {
		this.curvePoint.position.set(pos.x, pos.y, pos.z);
		this.add(this.curvePoint);
	} else {
		this.remove(this.curvePoint);
	}
	if (this.showFrame) {
		var frenetFrame = this.curve.getFrenetFrame(this.t);

		this.tArrow.position.copy(pos);
		this.tArrow.setDirection(frenetFrame.tangent);

		this.nArrow.position.copy(pos);
		this.nArrow.setDirection(frenetFrame.normal);

		this.bArrow.position.copy(pos);
		this.bArrow.setDirection(frenetFrame.binormal);

		this.add(this.tArrow);
		this.add(this.nArrow);
		this.add(this.bArrow);
	} else {
		this.remove(this.tArrow);
		this.remove(this.nArrow);
		this.remove(this.bArrow);
	}
	if (this.showCirc) {
		var curvature = JSCAGD.NumDer.getCurvature(this.curve, this.t);
		this.osculatingCir =  new THREE.TorusGeometry( 1/curvature, 1, 16, 100 );
		//this.osculatingCir.position.set(pos.x, pos.y, pos.z);
		//this.torus = new THREE.Mesh( this.osculatingCir, movingpointmaterial );
		this.torus.geometry.dispose();
		this.torus.geometry = this.osculatingCir;
		var orig = getCircleOrig(this.curve, this.t);
		this.torus.position.set(orig.x, orig.y, orig.z);

		if(is3D && (this.curve.curvetype === 'Bézier' || this.curve.curvetype === 'B-spline') ) {
			var binormal = this.curve.getBinormalBS(this.t);
			orig.add(binormal);
			this.torus.lookAt(orig);
		}
		this.add(this.torus);
	} else {
		this.remove(this.torus);
	}
	if (this.showKnots) {
		this.add(this.knotPoints);
	} else {
		this.remove(this.knotPoints);
	}
};

CurveEditor.prototype.setShowCurf = function() {
	
	if (this.showCurv) {
		this.add(this.curvatureFence);
	} else {
		this.remove(this.curvatureFence);
	}
};

CurveEditor.prototype.reset = function() {
	this.remove(this.knotPoints);
	this.knotPoints = new THREE.Object3D();
     this.knotPointsList = [];
    var i;
	if(this.curve.curvetype === 'B-spline') {
		this.knotlist = this.curve.U;
	} else if (this.curve.curvetype === 'P-curve') {
		this.knotlist = this.curve.knot;
	}  else if (this.curve.curvetype === 'Bézier') {
		this.knotlist = [];
		for (i = 0; i <= this.curve.n; i++) {
			this.knotlist[i] =  i/this.curve.n;
		}
	}
	for (i = this.knotlist.length - 1; i >= 0; i--) {
		var ti = this.knotlist[i];
		var pos = this.curve.getPoint(ti);
		var geometry = new THREE.SphereGeometry(6, 32, 32);
		var pt = new THREE.Mesh(geometry, curveParameters.knotpointmaterial);
		pt.position.set(pos.x, pos.y, pos.z);
		this.knotPoints.add(pt);
		this.knotPointsList[i] = pt;
	}
	
	if (this.showKnots) {
		this.add(this.knotPoints);
	}
};

