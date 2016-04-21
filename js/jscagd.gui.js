"use strict";

/* globals JSCAGD */
/* globals THREE */
/* globals dat */

// General control net handler for curves and surfaces

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


	// Control point moving
	this.control = new THREE.TransformControls(camera, renderer.domElement);
	this.control.size = 0.5;
	this.control.addEventListener('change', function() {
		that.update();
		onChange(); //undefined??
	});


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

	// Control points
	for (i = 0; i <= this.geometry.n; i++) {
		spgeometry = new THREE.SphereGeometry(20, 32, 32);
		sphere = new THREE.Mesh(spgeometry, pointmaterial);
		sphere.position.set(this.geometry.P[i].x, this.geometry.P[i].y, this.geometry.P[i].z);
		this.controlPoints.push(sphere);
		this.add(sphere);
	}
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
	this.control.update();
};

ControlNet.prototype.onMouseDown = function(event) {
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
};



// Curve drawing and edit/update handler

var CurveEditor = function(curve) {

	THREE.Object3D.call(this);

	this.curve = curve;

	// Materials
	this.material = new THREE.MeshLambertMaterial({
		color: 0x444444,
		shading: THREE.SmoothShading
	});

	this.movingpointmaterial = new THREE.MeshLambertMaterial({
		color: 0x2e9800,
		shading: THREE.SmoothShading
	});

	this.curve.dynamic = true;

	this.tube = new THREE.TubeGeometry(
		this.curve, //path
		100, //segments
		8, //radius
		8, //radiusSegments
		false //closed
	);

	// Tube around curve
	this.tubeMesh = new THREE.Mesh(this.tube, this.material);
	this.tubeMesh.dynamic = true;

	this.curve.needsUpdate = true;
	this.tube.verticesNeedUpdate = true;
	this.tubeMesh.verticesNeedUpdate = true;

	this.add(this.tubeMesh);

	this.t = 0.5;
	this.showFrame = true;
	this.showPoint = true;

	var pos = this.curve.getPoint(this.t);
	var geometry = new THREE.SphereGeometry(25, 32, 32);
	this.curvePoint = new THREE.Mesh(geometry, this.movingpointmaterial);
	this.curvePoint.position.set(pos.x, pos.y, pos.z);

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

};

CurveEditor.prototype = Object.create(THREE.Object3D.prototype);

CurveEditor.prototype.constructor = CurveEditor;

CurveEditor.prototype.update = function() {
	this.curve.needsUpdate = true;
	this.tube = new THREE.TubeGeometry(
		this.curve, //path
		100, //segments
		8, //radius
		8, //radiusSegments
		false //closed
	);
	this.tube.dynamic = true;
	this.tubeMesh.geometry.dispose();
	this.tubeMesh.geometry = this.tube;
	this.tubeMesh.geometry.verticesNeedUpdate = true;
	this.tubeMesh.verticesNeedUpdate = true;
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
};

CurveEditor.prototype.setShow = function() {
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

	init();
	render();

	function init() {

		// Scene and camera
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 10000);
		camera.position.set(2000, 800, 1300);
		camera.lookAt(new THREE.Vector3());

		// Grid
		scene.add(new THREE.GridHelper(500, 100));
		scene.fog = new THREE.Fog(0xe0e0e0, 150, 10000);

		// Lights
		var ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);
		var directionalLight = new THREE.DirectionalLight(0xffffff);
		directionalLight.position.x = 1;
		directionalLight.position.y = 0.2;
		directionalLight.position.z = -0.2;
		directionalLight.position.normalize();
		scene.add(directionalLight);

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
		orbit = new THREE.OrbitControls(camera, renderer.domElement);

		// Curve
		initCurve();

		// GUI 
		initGui();

		window.addEventListener('resize', onWindowResize, false);
		renderer.render(scene, camera);

	}

	function initCurve() {
		// Curve parameters
		var p0 = new THREE.Vector3(-500.0, -100, -500.0);
		var p1 = new THREE.Vector3(-500.0, 50, 0.0);
		var p2 = new THREE.Vector3(500.0, -50.0, 0.0);
		var p3 = new THREE.Vector3(500.0, 100, 500.0);
		var p4 = new THREE.Vector3(500.0, 100, 600.0);
		var P = [p0, p1, p2, p3, p4];
		var n = 4;
		curve = new JSCAGD.BsplineCurve(P, n, 3);


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


		cEditor = new CurveEditor(curve);
		scene.add(cEditor);

		controlNet = new ControlNet(curve, camera, renderer,
			function() {
				cEditor.update();
				cEditor.updateCurvePoint();
			}, pointmaterial, dashedmaterial);
		scene.add(controlNet);
	}

	function initGui() {
		gui = new dat.GUI();

		var parameter = gui.add(cEditor, 't').min(0).max(1).step(0.01).name('Parameter (t)');
		parameter.onChange(function() {
			cEditor.updateCurvePoint();
		});

		var params = {
			p: 3
		};
		var curveDegree = gui.add(params, 'p').min(1).max(4).step(1).name('Degree (p)');
		curveDegree.onChange(function() {
			curve.setDegree(params.p);
			cEditor.update();
			cEditor.updateCurvePoint();
		});

		var showPoint = gui.add(cEditor, 'showPoint').name('Show moving point');
		showPoint.onChange(function() {
			cEditor.setShow();
		});

		var showFrame = gui.add(cEditor, 'showFrame').name('Show Frenet frame');
		showFrame.onChange(function() {
			cEditor.setShow();
		});
		gui.open();
	}


	function render() {
		requestAnimationFrame(render);
		controlNet.render();
		renderer.render(scene, camera);
	}


	function onDocumentMouseDown(event) {
		event.preventDefault();
		controlNet.onMouseDown(event);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}
})();