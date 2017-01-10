"use strict";

/* globals JSCAGD */
/* globals THREE */
/* globals dat */

var is2D = true;
var is3D = !is2D;

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

	// Control point moving
	if(is3D) {
		this.control = new THREE.TransformControls(camera, renderer.domElement);
		this.control.size = 0.5;
	} else {
		this.control = new THREE.DragControls( this.controlPoints, camera, renderer.domElement );
	}

	this.control.addEventListener('change', function() {
		that.update();
		onChange(); //undefined??
	});
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



// Curve drawing and edit/update handler

var CurveEditor = function(curve, material, movingpointmaterial) {

	THREE.Object3D.call(this);

	this.curve = curve;

	this.curve.dynamic = true;

	this.tube = new THREE.TubeGeometry(
		this.curve, //path
		100, //segments
		8, //radius
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
	this.showFrame = true;
	this.showPoint = true;

	var pos = this.curve.getPoint(this.t);
	var geometry = new THREE.SphereGeometry(25, 32, 32);
	this.curvePoint = new THREE.Mesh(geometry, movingpointmaterial);
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
		var span = JSCAGD.KnotVector.findSpan(this.c_geom.U, this.c_geom.n, this.c_geom.p, u);
		var N = JSCAGD.BsplineBase.evalNonWanish(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);
		//var N = JSCAGD.BsplineBase.evalNonWanishDer(this.c_geom.U, this.c_geom.n, this.c_geom.p, u, span);

		//var N = JSCAGD.BernsteinBase.evalAll(this.c_geom.n, u);
		if (span - this.c_geom.p  <=  this.i && this.i <= span) {
			return new JSCAGD.Vector3(0, this.height * N[this.i - span + this.c_geom.p] - this.height/2, this.width * u - this.width/2);
		} else {
			return new JSCAGD.Vector3(0, - this.height/2, this.width * u - this.width/2);
		}
	}
);




var BaseFunctionCurves = function(geometry, width, height) {
	THREE.Object3D.call(this);

	this.width = width;
	this.height = height;
	this.geometry = geometry;

	this.objcontainer = new THREE.Object3D();
	this.baseCurves = [];


	for (var i = 0; i <= geometry.n; i++) {
		var material = new THREE.LineBasicMaterial({
			//color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
			color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
		});
		var baseCurve1 = new BaseCurve(geometry, i, width, height);
		var curvegeometry = new THREE.Geometry();
		curvegeometry.curve = baseCurve1;
		curvegeometry.vertices = baseCurve1.getPoints( 99 );
		curvegeometry.dynamic = true;

		this.baseCurves.push(curvegeometry);
		var curveObject = new THREE.Line(curvegeometry, material);
		curveObject.dynamic = true;
		this.objcontainer.add(curveObject);
		//objcontainer.update();
	}
	this.add(this.objcontainer);
	this.update();

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
		
		var u_min = this.geometry.U[i ];
		var u_max = this.geometry.U[i + this.geometry.p + 1];
		var samples = 99;
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

	var knotScene, knotCamera, knotContainer, knotRenderer;

	var that = this;

	init();

	render();


	function init() {

		// Scene and camera
		scene = new THREE.Scene();
		var camera3D = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 10000);
		camera3D.position.set(2000, 800, 1300);
		camera3D.lookAt(new THREE.Vector3());

		var camera2D = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 500, 1000 );
				camera2D.position.x = 0;
				camera2D.position.y = 200;
				camera2D.position.z = 0;

		if (is2D) {
			camera = camera2D;		
		} else {
			camera = camera3D;
		}
		

		// Grid
		if (is3D) {
			scene.add(new THREE.GridHelper(500, 100));
			scene.fog = new THREE.Fog(0xe0e0e0, 150, 10000);
		}
		

		// Lights
		var ambientLight = new THREE.AmbientLight(0xffffff);
		scene.add(ambientLight);

		if (is3D) {
			var directionalLight = new THREE.DirectionalLight(0xffffff);
			directionalLight.position.x = 1;
			directionalLight.position.y = 0.2;
			directionalLight.position.z = -0.2;
			directionalLight.position.normalize();
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
		var ambientLight = new THREE.AmbientLight(0xffffff);
		knotScene.add(ambientLight);

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
		var p0 = new THREE.Vector3(-500.0,500.0, 0.0);
		var p1 = new THREE.Vector3(-500.0, 0.0, 0.0);
		var p2 = new THREE.Vector3(-200.0, -50.0, 0.0);
		var p3 = new THREE.Vector3(0.0, 0.0, 0.0);
		var p4 = new THREE.Vector3(0.0, 250.0, 0.0);
		var p5 = new THREE.Vector3(-200.0, 400.0, 0.0);
		var p6 = new THREE.Vector3(-300.0, 200, 0.0);
		var p7 = new THREE.Vector3(-300.0, 200, 0.0);
		var p8 = new THREE.Vector3(-300.0, 300, 0.0);
		var p9 = new THREE.Vector3(-300.0, 400, 0.0);
		var p10 = new THREE.Vector3(-300.0, 500, 0.0);
		var P = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];
		var n = 10;
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

		controlNet = new ControlNet(curve, camera, renderer,
			function() {
				cEditor.update();
				cEditor.updateCurvePoint();
			}, pointmaterial, dashedmaterial);
		scene.add(controlNet);

	}

	function initGui() {

		gui = new dat.GUI({ width: 512, resizable : false });

		var parameter = gui.add(cEditor, 't').min(0).max(1).step(0.01).name('Parameter (t)');
		parameter.onChange(function() {
			cEditor.updateCurvePoint();
		});

		var params = {
			p: 3
		};
		var curveDegree = gui.add(params, 'p').min(1).max(10).step(1).name('Degree (p)');
		curveDegree.onChange(function() {
			curve.setDegree(params.p);
			cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.resetGeometry(curve);
			var knotDragger = new KnotDragger(curve, function() {
				cEditor.update();
				bsCurves.update();
				cEditor.updateCurvePoint();
			});
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

		var insertKnot = { add:function(){ 
			curve.insertKnot(cEditor.t); 
			cEditor.update(); 
			controlNet.reset(); 
			bsCurves.resetGeometry(curve);
			var knotDragger = new KnotDragger(curve, function() {
				cEditor.update();
				bsCurves.update();
				cEditor.updateCurvePoint();
			});
		}};
		gui.add(insertKnot,'add');

		var x = document.getElementsByTagName("ul"); // dangeruos, not too nice solution !!
		var customLi = document.createElement("li");
		customLi.className = 'cr number knotli';
		x[0].appendChild(customLi);

		var knotDiv = document.getElementById("knot");
		customLi.appendChild(knotDiv);

		var close = document.getElementsByClassName("close-button");

		close[0].addEventListener('click', function (event) {
			if(gui.closed) {
		    	customLi.style.height = 0 + 'px';
			} else {
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

		if(is3D) {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
		} else {
			camera.left = window.innerWidth / - 2;
			camera.right = window.innerWidth / 2;
			camera.top = window.innerHeight / 2;
			camera.bottom = window.innerHeight / - 2;
			camera.updateProjectionMatrix();
		}
		
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();

	}
})();