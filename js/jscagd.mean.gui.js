"use strict";

/* globals JSCAGD */
/* globals THREE */
/* globals dat */

// General control net handler for curves and surfaces

var is2D = true;
var is3D = !is2D;


var ControlNet = function(geometry, camera, renderer, onChange, pointmaterial, dashedmaterial) {

	THREE.Object3D.call(this);

	var that = this;
	var i;
	var spgeometry;
	var sphere;

	this.geometry = geometry;
	this.controlPoints = [];
	this.camera = camera;
	this.renderer = renderer;
	this.mouse = new THREE.Vector2();
	this.dashedmaterial = dashedmaterial;
	this.pointmaterial = pointmaterial;
	this.onChange = onChange;


	// Control point moving
	this.control3D = new THREE.TransformControls(this.camera, this.renderer.domElement);
	this.control2D = new THREE.DragControls( this.controlPoints, this.camera, this.renderer.domElement );
	this.control3D.size = 0.5;
	this.control2D.addEventListener('change', function() {
		that.update();
		that.onChange(); //undefined??
	});
	this.control3D.addEventListener('change', function() {
		that.update();
		that.onChange(); //undefined??
	});

	if(is3D) {
		this.control = this.control3D;
	} else {	
		this.control = this.control2D;
	}

	// Raycasting for selection
	this.raycaster = new THREE.Raycaster();
	this.raycaster.params.Points.threshold = 0.1;


	// Control polygon for curves
	if (geometry.controlNetType === 'curve') {
		this.controlPolygon = new THREE.Geometry();
		this.controlPolygon.vertices = this.geometry.P;
		this.controlPolygon.computeLineDistances();
		this.controlPolygonPath = new THREE.Line(this.controlPolygon, dashedmaterial);
		this.controlPolygon.dynamic = true;
		this.controlPolygonPath.dynamic = true;
		this.add(this.controlPolygonPath);
	}

	this.cptContainer = new THREE.Object3D();
	// Control points
	for (i = 0; i <= this.geometry.n; i++) {
		spgeometry = new THREE.SphereGeometry(15, 32, 32);
		sphere = new THREE.Mesh(spgeometry, pointmaterial);
		sphere.position.set(this.geometry.P[i].x, this.geometry.P[i].y, this.geometry.P[i].z);
		this.controlPoints.push(sphere);
		this.cptContainer.add(sphere);
	}
	this.add(this.cptContainer);
};

ControlNet.prototype = Object.create(THREE.Object3D.prototype);

ControlNet.prototype.constructor = ControlNet;

ControlNet.prototype.update = function() {
	var i;
	for (i = 0; i <= this.geometry.n; i++) {
		this.geometry.P[i] = this.controlPoints[i].position;
	}
	this.controlPolygon.computeLineDistances();
	this.controlPolygon.verticesNeedUpdate = true;
	//this.controlPolygonPath.verticesNeedUpdate = true;
	this.controlPolygon.lineDistancesNeedUpdate = true;

};

ControlNet.prototype.render = function() {
	if(is3D) {
		this.control.update();
	}
	
};

ControlNet.prototype.onMouseDown = function(event) {
	if(is3D) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		this.raycaster.setFromCamera(this.mouse, this.camera);
		var intersects = this.raycaster.intersectObjects(this.controlPoints);
		if (intersects.length > 0) {
			this.SELECTED = intersects[0].object;
			this.add(this.control);
			this.control.attach(this.SELECTED);
		} else if (this.SELECTED !== null) {
			this.control.detach(this.SELECTED);
			this.remove(this.control);
			this.SELECTED = null;
		}
	}
};

ControlNet.prototype.reset = function(newcamera) {
	this.camera = newcamera;
	for( var i = this.children.length - 1; i >= 0; i--) { var obj = this.children[i];
     this.remove(obj); }
	// Control polygon for curves
	if (this.geometry.controlNetType === 'curve') {
		this.controlPolygon = new THREE.Geometry();
		this.controlPolygon.vertices = this.geometry.P;
		this.controlPolygon.computeLineDistances();
		this.controlPolygonPath = new THREE.Line(this.controlPolygon, this.dashedmaterial);
		this.controlPolygon.dynamic = true;
		this.controlPolygonPath.dynamic = true;
		this.add(this.controlPolygonPath);
	}

	this.controlPoints = [];

	// Control points
	this.cptContainer = new THREE.Object3D();
	for (i = 0; i <= this.geometry.n; i++) {
		var spgeometry = new THREE.SphereGeometry(15, 32, 32);
		var sphere = new THREE.Mesh(spgeometry, this.pointmaterial);
		sphere.position.set(this.geometry.P[i].x, this.geometry.P[i].y, this.geometry.P[i].z);
		this.controlPoints.push(sphere);
		this.cptContainer.add(sphere);
	}
	this.add(this.cptContainer);
		// Control point moving
	var	that = this;
	
	if(is3D) {
		this.control3D = new THREE.TransformControls(this.camera, this.renderer.domElement);
		this.control3D.size = 0.5;
		this.control.dispose();
		this.control = this.control3D;
	} else {
		this.control2D = new THREE.DragControls( this.controlPoints, this.camera, this.renderer.domElement );
		this.control.dispose();
		this.control = this.control2D;
	}
	this.control.addEventListener('change', function() {
		that.update();
		that.onChange(); 
	});

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

var CurveEditor = function(curve, material, movingpointmaterial) {

	THREE.Object3D.call(this);

	this.curve = curve;

	this.curvatureFence = new THREE.Object3D();

	this.curve.dynamic = true;

	this.tube = new THREE.TubeGeometry(
		this.curve, //path
		300, //segments
		2, //radius
		8, //radiusSegments
		false //closed
	);

	// Tube around curve
	this.tubeMesh = new THREE.Mesh(this.tube, material);
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
	


	var pos = this.curve.getPoint(this.t);
	var geometry = new THREE.SphereGeometry(10, 32, 32);
	this.curvePoint = new THREE.Mesh(geometry, movingpointmaterial);
	this.curvePoint.position.set(pos.x, pos.y, pos.z);
    var curvature = JSCAGD.NumDer.getCurvature(this.curve, this.t);
	this.osculatingCir =  new THREE.TorusGeometry( 1/curvature, 1, 16, 100 );
	//this.osculatingCir.position.set(pos.x, pos.y, pos.z);
	this.torus = new THREE.Mesh( this.osculatingCir, movingpointmaterial );
	var orig = getCircleOrig(this.curve, this.t);
	this.torus.position.set(orig.x, orig.y, orig.z);
////		this.add(this.curvePoint);
	//}
	if (this.showCirc) {
		this.add(this.torus);
	}

	//var 
	if (this.showPoint) {
		this.add(this.curvePoint);
	}

	var frenetFrame = this.curve.getFrenetFrame(this.t);

	this.tArrow = new THREE.ArrowHelper(frenetFrame.tangent, pos, 200, 0x000000);
	this.nArrow = new THREE.ArrowHelper(frenetFrame.normal, pos, 200, 0x000000);
	this.bArrow = new THREE.ArrowHelper(frenetFrame.binormal, pos, 200, 0x000000);

	if (this.showFrame) {
		this.add(this.tArrow);
		this.add(this.nArrow);
		this.add(this.bArrow);
	}

	this.fenceResolution = 600;
	var material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
	this.curvatureFence = new THREE.Object3D();
	this.fenceLines = [];
	var ti = 0;
	var curvature;
	for (var i = 0; i < this.fenceResolution-1; i++) {
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
		
		var line = new THREE.Line( bgeometry,  material );
		var positions = line.geometry.attributes.position.array;
		positions[0] = curvepoint.x;
		positions[1] = curvepoint.y;
		positions[2] = curvepoint.z;

		positions[3] = fencepoint.x;
		positions[4] = fencepoint.y;
		positions[5] = fencepoint.z;

		//var geometry = new THREE.Geometry();
		//geometry.vertices.push(this.curve.getPoint(ti));
		//geometry.vertices.push(fencepoint);
		//var line = new THREE.Line(geometry, material);
		this.curvatureFence.add(line);
		this.fenceLines[i] = line;
		ti += 1/this.fenceResolution;
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
		300, //segments
		2, //radius
		8, //radiusSegments
		false //closed
	);

	this.tube.dynamic = true;
	this.tubeMesh.geometry.dispose();
	this.tubeMesh.geometry = this.tube;
	this.tubeMesh.geometry.verticesNeedUpdate = true;
	this.tubeMesh.verticesNeedUpdate = true;

	var ti = 0;
	for (var i = 0; i < this.fenceResolution-1; i++) {
		ti += 1/this.fenceResolution;
		var tan = this.curve.getTangent(ti);
		var normal = new JSCAGD.Vector3(tan.y, -tan.x, 0);
		var curvature = Math.max(Math.min(20*JSCAGD.NumDer.getCurvature(this.curve, ti), 2),-2);
		if(is3D && (this.curve.curvetype === 'Bézier' || this.curve.curvetype === 'B-spline') ) {
			//normal = new JSCAGD.Vector3(0, 0, 0);
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

	//}
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
	
////		this.add(this.curvePoint);
		//this.add(this.torus);
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
};

CurveEditor.prototype.setShowCurf = function() {
	
	if (this.showCurv) {
		this.add(this.curvatureFence);
	} else {
		this.remove(this.curvatureFence);
	}
};


var BaseCurve = JSCAGD.ParametricCurve.create(
	function(c_geom, i, width, height) {
		this.i = typeof i !== 'undefined' ? i : 1;
		this.c_geom = c_geom;
		this.width = width;
		this.height = height;
	},

	function(u) {
		//u = typeof u !== 'undefined' ? u : 0.5;
		//console.log(u);
		//var span = JSCAGD.KnotVector.findSpan(this.c_geom.U, this.c_geom.n, this.c_geom.p, u);

		//var N = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.c_geom.knot, this.c_geom.d);

		var N;
		if(this.c_geom.curvetype === 'meang1test') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner5(u, this.c_geom.knot, this.c_geom.d);
		} else if(this.c_geom.curvetype === 'meang1' || this.c_geom.curvetype === 'P-curve') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner4(u, this.c_geom.knot, this.c_geom.d);
		} else if (this.c_geom.curvetype === 'meang0') {
			N = JSCAGD.MeanBase.evalAllGeneralCorner3(u, this.c_geom.knot, this.c_geom.d);
		} else if (this.c_geom.curvetype === 'cyclicInf') {
			N = JSCAGD.MeanBase.evalAllCyclic1(u, this.c_geom.n+1, this.c_geom.d);
		} else if (this.c_geom.curvetype === 'cyclicTricky') {
			N = JSCAGD.MeanBase.evalAllCyclic2(u, this.c_geom.n+1, this.c_geom.d);
		}	else if (this.c_geom.curvetype === 'B-spline' || this.c_geom.curvetype === 'Bézier') {
			var span = JSCAGD.KnotVector.findSpan(this.c_geom.U, this.c_geom.n, this.c_geom.p, u);
			N = JSCAGD.BsplineBase.evalNonWanish(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);
		}	
		//var N = JSCAGD.MeanBase.evalAllCyclic2(u, this.c_geom.n+1, this.c_geom.d);
		//var N = JSCAGD.BsplineBase.evalNonWanishDer(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);

		//var N = JSCAGD.BernsteinBase.evalAll(this.c_geom.n, u);
		if (this.c_geom.curvetype === 'B-spline' || this.c_geom.curvetype === 'Bézier') {
			if (span - this.c_geom.p  <=  this.i && this.i <= span) {
				return new JSCAGD.Vector3(0, this.height * N[this.i - span + this.c_geom.p] - this.height/2, this.width * u - this.width/2);
			} else {
				return new JSCAGD.Vector3(0, - this.height/2, this.width * u - this.width/2);
			}
		} else {
			return new JSCAGD.Vector3(0, this.height * N[this.i] - this.height/2, this.width * u - this.width/2);
		}
		
	
	}
);




var BaseFunctionCurves = function(geometry, width, height) {
	THREE.Object3D.call(this);

	this.width = width;
	this.height = height;
	this.geometry = geometry;

	this.baseCurves = [];

	//var i = 3;
	this.objcontainer = new THREE.Object3D();
	for (var i = 0; i <= geometry.n; i++) {
		var material = new THREE.LineBasicMaterial({
			//color: "#"+((1<<24)*Math.random()|0).toString(16) //color: "#000000", 
			linewidth: 2 ,
			color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
		});
		var baseCurve1 = new BaseCurve(geometry, i, width, height);
		var curvegeometry = new THREE.Geometry();
		curvegeometry.curve = baseCurve1;
		curvegeometry.vertices = baseCurve1.getPoints( 300 );
		curvegeometry.dynamic = true;

		this.baseCurves.push(curvegeometry);
		var curveObject = new THREE.Line(curvegeometry, material);
		curveObject.dynamic = true;
		this.objcontainer.add(curveObject);
		this.update();
	}
	this.add(this.objcontainer);
	var curvegeometry = new THREE.Geometry();
	curvegeometry.dynamic = true;
	//curvegeometry.vertices.push(return new JSCAGD.Vector3(0, - this.height/2, this.width * u - this.width/2));
};

BaseFunctionCurves.prototype = Object.create(THREE.Object3D.prototype);

BaseFunctionCurves.prototype.constructor = BaseFunctionCurves;

BaseFunctionCurves.prototype.update = function () {
	for (var i = 0; i < this.baseCurves.length; i++) {
		//this.baseCurves[i].vertices = this.baseCurves[i].curve.getPoints( 10 );
		//var u_min = 0;
		//var u_max = 1;
		
		var u_min = 0;
		var u_max = 1;
		var samples = 300;
		var diff = (u_max - u_min) / (samples );
		var u = u_min;
		for (var j = 0; j < samples; j++) {
			//this.baseCurves[i].curve.getPoint( u );
			this.baseCurves[i].vertices[j] = this.baseCurves[i].curve.getPoint( u );
			u += diff;
		}
		this.baseCurves[i].vertices[samples] = this.baseCurves[i].curve.getPoint( u_max );
		//this.baseCurves[i].vertices = this.baseCurves[i].curve.getPoints( 100 );
		this.baseCurves[i].verticesNeedUpdate = true;
	}
};



BaseFunctionCurves.prototype.resetGeometry = function (newgeometry) {

	this.geometry = newgeometry;

	this.baseCurves = [];
	this.remove(this.objcontainer);
	this.objcontainer = new THREE.Object3D();

	for (var i = 0; i <= this.geometry.n; i++) {
		var material = new THREE.LineBasicMaterial({
			linewidth: 2 ,
			color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
		});
		var baseCurve1 = new BaseCurve(this.geometry, i, this.width, this.height);
		var curvegeometry = new THREE.Geometry();
		curvegeometry.curve = baseCurve1;
		curvegeometry.vertices = baseCurve1.getPoints( 99 );
		curvegeometry.dynamic = true;

		this.baseCurves.push(curvegeometry);
		var curveObject = new THREE.Line(curvegeometry, material);
		curveObject.dynamic = true;
		this.objcontainer.add(curveObject);
	}
	this.add(this.objcontainer);
	this.update();

	var curvegeometry = new THREE.Geometry();
	curvegeometry.dynamic = true;
	this.update();
};



function hideGUIElem(datguielement) {
	datguielement.domElement.parentNode.parentNode.style.display = 'none';
};

function showGUIElem(datguielement) {
	datguielement.domElement.parentNode.parentNode.style.display = 'block';
};

// Main program

(function() {
	var container;
	var scene, camera, renderer;
	var gui;
	var controlNet;
	var curve;
	var cEditor;
	var orbit;
	var bsCurves;
	//var getCurvature;
	var knotclosed = false;
	var camera2D, camera3D, directionalLight, grid3D;

	var knotScene, knotCamera, knotContainer, knotRenderer;
	var parameterD, insertKnot, curveDegree, elevateDegree;
	init();

	render();


	function init() {

		// Scene and camera
		scene = new THREE.Scene();
		camera3D = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 10000);
		camera3D.position.set(2000, 800, 1300);
		camera3D.lookAt(new THREE.Vector3(0,0,1));

		camera2D = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 500, 1000 );
		camera2D.position.x = 0;
		camera2D.position.y = 200;
		camera2D.position.z = 0;

		if (is2D) {
			camera = camera2D;		
		} else {
			camera = camera3D;
		}


		// Grid
		grid3D = new THREE.GridHelper(500, 100);
		grid3D.rotation.x = 1.57;
		//grid3D.lookAt(new THREE.Vector3(10,10,10));
		if (is3D) {
			scene.add(grid3D);
		}
		scene.fog = new THREE.Fog(0xe0e0e0, 150, 10000);
		// Lights
		var ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		
			directionalLight = new THREE.DirectionalLight(0xffffff);
			directionalLight.position.x = 1;
			directionalLight.position.y = 0.2;
			directionalLight.position.z = -0.2;
			directionalLight.position.normalize();
		if (is3D) {
			scene.add(directionalLight);
		}

		// Renderer
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(0xf0f0f0);
		renderer.setSize(window.innerWidth, window.innerHeight);

		// Div container
		container = document.getElementById('container');
		container.appendChild(renderer.domElement);
		container.addEventListener('mousedown', onDocumentMouseDown, false);
		
		// OrbitControl
		if (is3D) {
			orbit = new THREE.OrbitControls(camera, renderer.domElement);
		} 
		
		// Curve
		initCurve();

		// GUI 
		initGui();

		initKnotEditor();



		window.addEventListener('resize', onWindowResize, false);
		renderer.render(scene, camera);

	}


	function initKnotEditor() {
		var width = 500;
		var height = 300;
		// Scene and camera
		knotScene = new THREE.Scene();
		//knotCamera = new THREE.PerspectiveCamera(25, width / height, 1, 10000);
		knotCamera = new THREE.OrthographicCamera( -width/2, width/2, height/2, -height/2, 10, 10000 );
		knotCamera.position.set(-2000, 0, 0);
		knotCamera.lookAt(new THREE.Vector3());

		// Lights
		//var ambientLight = new THREE.AmbientLight(0xffffff);
		//knotScene.add(ambientLight);

		// Renderer
		knotRenderer = new THREE.WebGLRenderer({
			antialias: true
		});
		knotRenderer.setPixelRatio(window.devicePixelRatio);
		knotRenderer.setClearColor(0xffffff);
		knotRenderer.setSize(width, height);

		// OrbitControl
		//var orbit2 = new THREE.OrbitControls(knotCamera, knotRenderer.domElement);

		// Div container
		knotContainer = document.getElementById('knotView');
		knotContainer.appendChild(knotRenderer.domElement);
		//knotContainer.addEventListener('mousedown', onDocumentMouseDown, false);

		
		bsCurves = new BaseFunctionCurves(curve, width, height);

		knotScene.add(bsCurves);
		

		//knotScene.add(new THREE.GridHelper(500, 100));

		knotRenderer.render(knotScene, knotCamera);

		var knotDragger = new KnotDragger(curve, function() {
			cEditor.update();
			bsCurves.update();
			cEditor.updateCurvePoint();
		});

	}

	function initCurve() {
		// Curve parameters
		var p0 = new THREE.Vector3(-600.0,0.0, 0.0);
		var p1 = new THREE.Vector3(-400.0, 300.0, 0.0);
		var p2 = new THREE.Vector3(-200.0, 0.0, 0.0);
		var p3 = new THREE.Vector3(0.0, 0.0, 0.0);
		var p4 = new THREE.Vector3(100.0, 200.0, 0.0);
		var p5 = new THREE.Vector3(0.0, 350.0, 0.0);
		var p6 = new THREE.Vector3(-200.0, 350, 0.0);
		var p7 = new THREE.Vector3(-300.0, 200, 0.0);
		var p8 = new THREE.Vector3(-300.0, 300, 0.0);
		var p9 = new THREE.Vector3(-300.0, 400, 0.0);
		var p10 = new THREE.Vector3(-300.0, 500, 0.0);
		var P = [p0, p1, p2, p3, p4, p5, p6];
		var n = 6;
		curve = new JSCAGD.MeanCurve(P, n, 0.2);
		//getCurvature = JSCAGD.NumDer.getCurvature(curve.getPoint);

		// Materials
		var pointmaterial = new THREE.MeshLambertMaterial({
			color: 0x8C001A,
			shading: THREE.SmoothShading
		});

		var dashedmaterial = new THREE.LineDashedMaterial({
			color: 0x000000,
			linewidth: 1,
			dashSize: 30,
			gapSize: 20
		});

		var material = new THREE.MeshLambertMaterial({
			color: 0x444444,
			shading: THREE.SmoothShading
		});

		var movingpointmaterial = new THREE.MeshLambertMaterial({
			color: 0x2e9800,
			shading: THREE.SmoothShading
		});

		cEditor = new CurveEditor(curve, material, movingpointmaterial);
		scene.add(cEditor);
		for (var i = 0; i < 10; i++) {
			//var curve2 = new JSCAGD.MeanCurve(P, n, 0.4*i);
			//var cEditor2 = new CurveEditor(curve2, material, movingpointmaterial);
			
			//cEditor2.setShow();
		//	scene.add(cEditor2);
			//cEditor2.setShow();
		}
		

		controlNet = new ControlNet(curve, camera, renderer,
			function() {
				cEditor.update();
				cEditor.updateCurvePoint();
			}, pointmaterial, dashedmaterial);
		scene.add(controlNet);
	}

	function initGui() {
		gui = new dat.GUI({ width: 512, resizable : false });
		var params = {
			p: 3,
			curv: 0
		};
		var typeChange = gui.add(curve, 'curvetype', [ 'Bézier' , 'B-spline', 'P-curve' ] ).name('Curve type');

		//var typeChange = gui.add(curve, 'curvetype', [ 'P-curve', 'meang1test', 'meang1', 'meang0', 'cyclicInf', 'cyclicTricky', 'Bézier' , 'B-spline' ] ).name('Curve type');
		typeChange.onChange(function(value) {
			if(curve.curvetype === 'Bézier') {
				hideGUIElem(curveDegree);
				hideGUIElem(parameterD);
				hideGUIElem(insertKnot);
				showGUIElem(elevateDegree);
				curve.setDegree(curve.n);
				var knotDragger = new KnotDragger(curve, function() {
					cEditor.update();
					bsCurves.update();
					cEditor.updateCurvePoint();
				});
			} else if(curve.curvetype === 'B-spline') {
				hideGUIElem(parameterD);
				showGUIElem(curveDegree);
				hideGUIElem(insertKnot);
				curve.setDegree(params.p);
				var knotDragger = new KnotDragger(curve, function() {
					cEditor.update();
					bsCurves.update();
					cEditor.updateCurvePoint();
				});
				
			} else {
				showGUIElem(parameterD);
				showGUIElem(insertKnot);
				hideGUIElem(curveDegree);
				hideGUIElem(elevateDegree);
				var knotDragger = new KnotDraggerMean(curve, function() {
					cEditor.update();
					bsCurves.update();
					cEditor.updateCurvePoint();
				});
				bsCurves.resetGeometry(curve);
			}
			cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.update();
			
		});

		parameterD = gui.add( cEditor, 'd' ).min(0).max(10).step(0.01).name('d');
		parameterD.onChange(function(value) {
			curve.setD(cEditor.d);
			cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.update();
		});
		//parameterD.domElement.parentNode.parentNode.style.display = 'block';




		curveDegree = gui.add(params, 'p').min(1).max(10).step(1).name('Degree (p)');
		curveDegree.onChange(function() {
			if (curve.p != params.p) {
				curve.setDegree(params.p);
				cEditor.update();
				cEditor.updateCurvePoint();
				bsCurves.resetGeometry(curve);
				var knotDragger = new KnotDragger(curve, function() {
					cEditor.update();
					bsCurves.update();
					cEditor.updateCurvePoint();
				});
			}
		});
		hideGUIElem(curveDegree);

		var parameter = gui.add(cEditor, 't').min(0).max(1).step(0.001).name('Parameter (t)');
		parameter.onChange(function() {
			cEditor.updateCurvePoint();
			//params.curv = JSCAGD.NumDer.getCurvature(curve, cEditor.t);
		});



		//var curvParam = gui.add(params, 'curv').step(0.0001).name('Curvature').listen();


		var showPoint = gui.add(cEditor, 'showPoint').name('Moving point at t');
		showPoint.onChange(function() {
			cEditor.setShow();
		});

		var showCurf = gui.add(cEditor, 'showCurv').name('Curvature fence');
		showCurf.onChange(function() {
			cEditor.setShowCurf();
		});

		var showFrame = gui.add(cEditor, 'showFrame').name('Frenet frame');
		showFrame.onChange(function() {
			cEditor.setShow();
		});

		var showCirc = gui.add(cEditor, 'showCirc').name('Osculating circle');
		showCirc.onChange(function() {
			cEditor.setShow();
		});

		var is3DParam = {
			is3DON: false
		}

		var trigger3D = gui.add(is3DParam, 'is3DON').name('3D');
		trigger3D.onChange(function() {
			is3D = is3DParam.is3DON;
			is2D = !is3D;
			
			if (is2D) {
				camera = camera2D;	
				scene.remove(directionalLight);
				orbit.dispose();
				scene.remove(grid3D);
			} else {
				camera = camera3D;
				scene.add(directionalLight);
				orbit = new THREE.OrbitControls(camera, renderer.domElement);
				scene.add(grid3D);
			}
			controlNet.reset(camera); 
			render();
		});
		
		var evelateDegreeFun = { preform:function(){ 
			curve.elevateDegree();
			cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.resetGeometry(curve);
			controlNet.reset(camera); 
			var knotDragger = new KnotDragger(curve, function() {
				cEditor.update();
				bsCurves.update();
				cEditor.updateCurvePoint();
			});
		}};

		elevateDegree = gui.add(evelateDegreeFun,'preform').name('Degree elevation');
		//hideGUIElem(elevateDegree);

		var insertKnotFun = { add:function(){ 
			curve.insertKnot(cEditor.t); 
			cEditor.update(); 
			controlNet.reset(camera); 
			bsCurves.resetGeometry(curve);
			var knotDragger = new KnotDraggerMean(curve, function() {
				cEditor.update();
				bsCurves.update();
				cEditor.updateCurvePoint();
			});
		}};




		insertKnot = gui.add(insertKnotFun,'add').name('Insert knot');
		showGUIElem(curveDegree);
		hideGUIElem(parameterD);
		hideGUIElem(insertKnot);
		hideGUIElem(elevateDegree);
		gui.open();

		var x = document.getElementsByTagName("ul"); // dangeruos, not too nice solution !!
		var customLi = document.createElement("li");
		customLi.className = 'cr number knotli';

		var triggerLI = { trigger: function() {
				if(!knotclosed) {
			    	customLi.style.height = 0 + 'px';
			    	knotclosed = true;
				} else {
					customLi.style.height = 320 + 'px';
					knotclosed = false;
				}
			}
		};
		gui.add(triggerLI,'trigger').name('Show/hide base functions and knots');

		x[0].appendChild(customLi);

		var knotDiv = document.getElementById("knot");
		customLi.appendChild(knotDiv);

		var close = document.getElementsByClassName("close-button");

		close[0].addEventListener('click', function (event) {
			if(gui.closed) {
		    	customLi.style.height = 0 + 'px';
			} else if(!knotclosed) {
				customLi.style.height = 320 + 'px';	
			}
		 });
		customLi.style.height = 320 + 'px';




	}


	function render() {
		requestAnimationFrame(render);
		controlNet.render();
		renderer.render(scene, camera);
		knotRenderer.render(knotScene, knotCamera);
	}


	function onDocumentMouseDown(event) {
		event.preventDefault();
		controlNet.onMouseDown(event);
	}

	function onWindowResize() {

		
			camera3D.aspect = window.innerWidth / window.innerHeight;
			camera3D.updateProjectionMatrix();
		
			camera2D.left = window.innerWidth / - 2;
			camera2D.right = window.innerWidth / 2;
			camera2D.top = window.innerHeight / 2;
			camera2D.bottom = window.innerHeight / - 2;
			camera2D.updateProjectionMatrix();
		
		
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();

	}
})();



