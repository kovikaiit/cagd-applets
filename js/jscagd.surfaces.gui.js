"use strict";

/* globals JSCAGD */
/* globals THREE */
/* globals dat */

(function() {
var container;
var scene, camera, renderer;
var geometry, material, surfaceMesh, controlPolygons, controlPolygonPaths, bezierGeometry;
var controlPoints = [];
var dashedmaterial, pointmaterial, movingpointmaterial, isophotesmaterial, curvmaterial;
var orbit;
var P, P_rev;
var control;
var mouse = new THREE.Vector2();
var raycaster;
var objects = [];
var SELECTED;
var gui;
var parameters;
var curvePoint;
var n, m;
var Psurface;
var controlNet;
var surfaceTriMesh;
var showPoint, showFrame, tArrow, vArrow, nArrow, surfaceType;
init();
render();

function getUrlVars() {
	var vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}

function init() {

	// Scene and camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.set(2000, 800, 1300);
	camera.lookAt(new THREE.Vector3());


	// Grid
	scene.add(new THREE.GridHelper(500, 100));
	//scene.fog = new THREE.Fog( 0xe0e0e0, 150, 10000 );

	// Lights
	var ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.x = 50;
	directionalLight.position.y = 200;
	directionalLight.position.z = 0;
	//directionalLight.position.normalize();
	scene.add(directionalLight);

	var directionalLight2 = new THREE.DirectionalLight(0xffffff);
	directionalLight2.position.copy(camera.position);
	scene.add(directionalLight2);


	var pointLight = new THREE.PointLight(0xffffff, 4, 800);
	pointLight.position.x = 0;
	pointLight.position.y = 600;
	pointLight.position.z = 0;
	scene.add(pointLight);
	var pointLight2 = new THREE.PointLight(0xffffff, 4, 800);
	pointLight2.position.x = 0;
	pointLight2.position.y = -600;
	pointLight2.position.z = 0;
	scene.add(pointLight2);

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

	// Raycasting for selection
	raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 0.1;

	// OrbitControl
	orbit = new THREE.OrbitControls(camera, renderer.domElement);
	orbit.addEventListener('change', light_update);

	function light_update() {
		directionalLight2.position.copy(camera.position);
		render();
	}

	var textureLoader = new THREE.TextureLoader();
	var textureSphere = textureLoader.load("resources/isophotes_large.bmp", render);
	textureSphere.mapping = THREE.SphericalReflectionMapping;
	var textureLoader2 = new THREE.TextureLoader();
	var texture = textureLoader2.load('resources/highgrid.jpg', render);
	isophotesmaterial = new THREE.MeshPhongMaterial({
		envMap: textureSphere,
		side: THREE.DoubleSide
	});
	curvmaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide });

	material = new THREE.MeshPhongMaterial( { map: texture, color: 0x111bdd, shading: THREE.SmoothShading, reflectivity: 100.0, metalness: 10.0, side: THREE.DoubleSide, transparent: true, opacity: 0.9} ) ;
	pointmaterial = new THREE.MeshLambertMaterial({
		color: 0x880000,
		shading: THREE.SmoothShading
	});
	movingpointmaterial = new THREE.MeshLambertMaterial({
		color: 0x2e9800,
		shading: THREE.SmoothShading
	});
	dashedmaterial = new THREE.LineBasicMaterial({
		color: 0xAA0000,
		linewidth: 1
	});


	initSurface();
	initGui();


	drawSurface();

	// Control point moving
	control = new THREE.TransformControls(camera, renderer.domElement);
	control.size = 0.5;
	control.addEventListener('change', function() {
		updateSurface();
		updateSurfacePoint();
		render();
	});

	window.addEventListener('resize', onWindowResize, false);
	renderer.render(scene, camera);


}

function initSurface() {
	// Surface parameters
	n = 4;
	m = 4;
	P = [];
	P_rev = [];
	var k, l;
	for (k = 0; k <= n; k++) {
		P.push([]);
		for (l = 0; l <= m; l++) {
			//P[k][l] = new THREE.Vector3(400 - k * 200, 100, 400 - l * 200);
			P[k][l] = new THREE.Vector3(400 - k * 200, -10*(k-2)*(k-2)*(l-2)*(l-2) + 200, 400 - l * 200);
		}
	}
	Psurface = new JSCAGD.BezierSurface(P, n, m);
}

function hideGUIElem(datguielement) {
	datguielement.domElement.parentNode.parentNode.style.display = 'none';
}

function showGUIElem(datguielement) {
	datguielement.domElement.parentNode.parentNode.style.display = 'block';
}

function initGui() {
	gui = new dat.GUI();

	parameters = {
		u: 0.5, // numeric slider
		v: 0.5,
		du: 0.5,
		dv: 0.5,
		resolution: 50,
		meanmax: 0.002,
		exportToSTL: function() {

			var exporter = new THREE.STLExporter();
			var result = exporter.parse(surfaceMesh);
			var blob = new Blob([result], {
				type: "text/plain;charset=ascii"
			});
			saveAs(blob, "surface.stl");

		},
		exportToOBJ: function() {
			var result = surfaceTriMesh.saveOBJ();
			var blob = new Blob([result], {
				type: "text/plain;charset=ascii"
			});
			saveAs(blob, "surface.obj");

		},
		visMode: "isolines",
		type: "Bézier",
		showTrieder: true
	};
	if(getUrlVars()["psurface"] === "on") {
		surfaceType = gui.add(parameters, 'type', [ 'Bézier' , 'P-surface', 'B-spline' ] ).name('Surface');
	} else {
		surfaceType = gui.add(parameters, 'type', [ 'Bézier' , 'B-spline' ] ).name('Surface');
	}
	//var surfaceType = gui.add(parameters, 'type', [ 'Bézier' , 'P-surface', 'B-spline' ] ).name('Visualization mode');
	surfaceType.onChange(function() {
		if (parameters.type === 'Bézier') {
			hideGUIElem(parameterDu);
			hideGUIElem(parameterDv);
			Psurface = new JSCAGD.BezierSurface(P, n, m);
		} else if (parameters.type === 'P-surface') {
			Psurface = new JSCAGD.PSurface(P, n, m, parameters.du, parameters.dv);
			showGUIElem(parameterDu);
			showGUIElem(parameterDv);
		} else if (parameters.type === 'B-spline'){
			Psurface = new JSCAGD.BsplineSurface(P, n, m, 3);
			hideGUIElem(parameterDu);
			hideGUIElem(parameterDv);
		}	
		updateSurfacePoint();
		updateSurface();
		render();
	});

	var vismodes = gui.add(parameters, 'visMode', [ 'isolines' , 'isophotes', 'meanCurv' ] ).name('Mode');
	vismodes.onChange(function() {
		if (parameters.visMode === 'isolines') {
			surfaceMesh.material = material;
			hideGUIElem(parameterMeanMax);
			

		} else if (parameters.visMode === 'isophotes') {
			surfaceMesh.material = isophotesmaterial;
			hideGUIElem(parameterMeanMax);
			
		} else if (parameters.visMode === 'meanCurv') {
			surfaceMesh.material = curvmaterial;
			showGUIElem(parameterMeanMax);
			
			updateSurface();
		}
			
			render();
		});




	var showPointGUI = gui.add(parameters, 'showTrieder').name('Moving point');
	showPointGUI.onChange(function() {
		showPoint = parameters.showTrieder;
		showFrame = parameters.showTrieder;
		setSurfacePoint();
		updateSurfacePoint();
		render();
	});
	var parameterDu = gui.add(parameters, 'du').min(0.001).max(3).step(0.001).name('du');
	parameterDu.onChange(function() {
		updateSurfacePoint();
		updateSurface();
		render();
	});
	hideGUIElem(parameterDu);


	var parameterDv = gui.add(parameters, 'dv').min(0.001).max(3).step(0.001).name('dv');
	parameterDv.onChange(function() {
		updateSurfacePoint();
		updateSurface();
		render();
	});
	hideGUIElem(parameterDv);


	var parameterMeanMax = gui.add(parameters, 'meanmax').min(0.0001).max(0.01).step(0.0001).name('Mean max.');
	parameterMeanMax.onChange(function() {
		
		updateSurface();
		render();
	});
	hideGUIElem(parameterMeanMax);


		var parameter = gui.add(parameters, 'u').min(0).max(1).step(0.01).name('Parameter (u)');
		parameter.onChange(function() {
			updateSurfacePoint();
			render();
		});
		var parameterV = gui.add(parameters, 'v').min(0).max(1).step(0.01).name('Parameter (v)');
		parameterV.onChange(function() {
			updateSurfacePoint();
			render();
		});

	var resolution = gui.add(parameters, 'resolution').min(10).max(150).step(1).name('Resolution');
	resolution.onChange(function() {
		surfaceTriMesh = Psurface.getMesh(parameters.resolution);
		bezierGeometry.dispose();
		bezierGeometry = surfaceTriMesh.getTHREEGeometry();
		updateSurface();
		render();
	});


	var opacity = gui.add(material, 'opacity').min(0).max(1).step(0.01).name('Opacity');
	opacity.onChange(render);

	var saveFileFun = {
		save: function() {
			var blob = new Blob([saveSketchesFile()], {
				type: "text/plain;charset=utf-8"
			});
			saveAs(blob, "curvenet.skd");
		}
	};
	var saveSKD = gui.add(saveFileFun, 'save').name('Save c.net (skd)');
	hideGUIElem(saveSKD);

	var saveFileFunT = {
		save: function() {
			var blob = new Blob([saveFile()], {
				type: "text/plain;charset=utf-8"
			});
			saveAs(blob, "surface.txt");
		}
	};
	gui.add(saveFileFunT, 'save').name('Save surface');

	gui.add(parameters, 'exportToOBJ').name("Export OBJ");
	gui.add(parameters, 'exportToSTL').name("Export STL");

	var newInput = document.createElement("INPUT");
	newInput.id = "file-input";
	newInput.type = "file";
	newInput.addEventListener('change', readSingleFile, false);

	function readSingleFile(e) {
		var file = e.target.files[0];
		if (!file) {
			return;
		}
		var reader = new FileReader();
		reader.onload = function(e) {
			var contents = e.target.result;
			loadSurface(contents);
		};
		reader.readAsText(file);
	}

	var x = gui.domElement.getElementsByTagName("ul"); // dangeruos, not too nice solution !!
	var customLi = document.createElement("li");
	customLi.className = 'cr number openli';

	x[0].appendChild(customLi);

	customLi.appendChild(newInput);

	gui.open();
}

function drawSurface() {
	var l, k;
	objects = [];

	//bezierGeometry = new THREE.ParametricGeometry(function(u, v) {
	//	return Psurface.getPoint(u, v);
	//}, parameters.resolution, parameters.resolution);
	surfaceTriMesh = Psurface.getMesh(parameters.resolution);
	//bezierGeometry.dispose();
	bezierGeometry = surfaceTriMesh.getTHREEGeometry();
	bezierGeometry.computeVertexNormals();

	controlNet = new THREE.Object3D();
	controlPolygonPaths = [];
	controlPolygons = [];
	for (k = 0; k <= n; k++) {
		controlPolygons.push(new THREE.Geometry());
		controlPolygons[k].vertices = P[k];
		controlPolygons[k].computeLineDistances();
		controlPolygonPaths.push(new THREE.Line(controlPolygons[k], dashedmaterial));
		controlNet.add(controlPolygonPaths[k]);
	}
	P_rev = [];
	for (l = 0; l <= m; l++) {
		P_rev.push([]);
		for (k = 0; k <= n; k++) {

			P_rev[l][k] = P[k][l];

		}
	}

	for (l = 0; l <= m; l++) {
		controlPolygons.push(new THREE.Geometry());
		controlPolygons[n + 1 + l].vertices = P_rev[l];
		controlPolygons[n + 1 + l].computeLineDistances();
		controlPolygonPaths.push(new THREE.Line(controlPolygons[n + 1 + l], dashedmaterial));
		controlNet.add(controlPolygonPaths[n + 1 + l]);
	}

	// Mesh generation
	surfaceMesh = new THREE.Mesh(bezierGeometry, material);
	scene.add(surfaceMesh);

	controlPoints = [];
	// Control points
	for (k = 0; k <= n; k++) {
		controlPoints.push([]);
		for (l = 0; l <= m; l++) {
			geometry = new THREE.SphereGeometry(15, 10, 10);
			//geometry.translate(P[i].x, P[i].y, P[i].z);
			var sphere = new THREE.Mesh(geometry, pointmaterial);
			sphere.position.set(P[k][l].x, P[k][l].y, P[k][l].z);
			objects.push(sphere);
			controlPoints[k].push(sphere);
			controlNet.add(sphere);
		}
	}
	scene.add(controlNet);

	showPoint = true;
	showFrame = true;
	
	// Point at 't'
	geometry = new THREE.SphereGeometry(10, 32, 32);
	curvePoint = new THREE.Mesh( geometry, movingpointmaterial );
	var pos = PointOnBezierSurface(P, n, m, parameters.u, parameters.v);
	curvePoint.position.set(pos.x, pos.y, pos.z);
	scene.add(curvePoint);


	var tangentU =  TangentUOnBezierSurface(P, n, m, parameters.u, parameters.v);
	tArrow = new THREE.ArrowHelper(tangentU, pos, 200, 0x000000);
	scene.add(tArrow);
	var tangentV =  TangentVOnBezierSurface(P, n, m, parameters.u, parameters.v);
	vArrow = new THREE.ArrowHelper(tangentV, pos, 200, 0x000000);
	scene.add(vArrow);
	var vectorx = new THREE.Vector3();
	vectorx.crossVectors(tangentU, tangentV);
	vectorx.multiplyScalar(-1);
	nArrow = new THREE.ArrowHelper(vectorx, pos, 200, 0x000000);
	scene.add(nArrow);
}

function MeanToColor(x, d) {
	var r, g, b;
	if(x < 0) {
		b = Math.min(-x / d, 1);
		r = 0;
		g = 1-b;
	} else {
		r = Math.min(x / d, 1);
		b = 0;
		g = 1-r;
	}
	var max = Math.max(r,Math.max(g,b));
	//return new THREE.Color(0.5,0.5,0);
	return new THREE.Color(r/max,g/max,b/max);
}

function updateSurface() {
	var k, l, i;
	for (k = 0; k <= n; k++) {
		for (l = 0; l <= m; l++) {
			P[k][l] = controlPoints[k][l].position;
		}
	}
	for (l = 0; l <= m; l++) {
		for (k = 0; k <= n; k++) {
			P_rev[l][k] = P[k][l];
		}
	}
	//bezierGeometry.dispose();
	Psurface.du = parameters.du;
	Psurface.dv = parameters.dv;
	//surfaceMesh.geometry.dispose();

	surfaceTriMesh.updateVertices(Psurface.getVertices(parameters.resolution));
	//bezierGeometry = surfaceTriMesh.getTHREEGeometry();
	bezierGeometry.computeVertexNormals();

	if(parameters.visMode === 'meanCurv') {
		
		surfaceTriMesh.calcMeanCurvatures();
		for (i = 0; i < surfaceTriMesh.m; i++) {
			for (k = 0; k < 3; k++) {
				bezierGeometry.faces[i].vertexColors[k].copy(  MeanToColor(surfaceTriMesh.V[surfaceTriMesh.T[i][k]].mean, parameters.meanmax));
			}
		}
		surfaceMesh.geometry.colorsNeedUpdate = true;
	}
	//bezierGeometry = new THREE.ParametricGeometry(function(u, v) {
	//	return Psurface.getPoint(u, v);
	//}, parameters.resolution, parameters.resolution);



	bezierGeometry.verticesNeedUpdate = true;
	bezierGeometry.dynamic = true;

	surfaceMesh.geometry = bezierGeometry;

	//controlPolygon = new THREE.Geometry();
	//controlPolygon.vertices = P;
	//controlPolygon.computeLineDistances();
	//controlPolygonPath.geometry = controlPolygon;
	for (k = 0; k <= n; k++) {
		controlPolygons[k] = new THREE.Geometry();
		controlPolygons[k].vertices = P[k];
		controlPolygons[k].computeLineDistances();
		controlPolygonPaths[k].geometry = controlPolygons[k];
	}
	for (l = 0; l <= m; l++) {
		controlPolygons[n + 1 + l] = new THREE.Geometry();
		controlPolygons[n + 1 + l].vertices = P_rev[l];
		controlPolygons[n + 1 + l].computeLineDistances();
		controlPolygonPaths[n + 1 + l].geometry = controlPolygons[n + 1 + l];
	}
}

function updateSurfacePoint() {
	var pos = Psurface.getPoint(parameters.u, parameters.v);
	//this.curvePoint.position.set(pos.x, pos.y, pos.z);

	if (showPoint) {

		curvePoint.position.set(pos.x, pos.y, pos.z);
	} 
	if (showFrame) {
		var tangentU =  TangentUOnBezierSurface(P, n, m, parameters.u, parameters.v);
		tArrow.position.copy(pos);
		tArrow.setDirection(tangentU);
		var tangentV =  TangentVOnBezierSurface(P, n, m, parameters.u, parameters.v);
		vArrow.position.copy(pos);
		vArrow.setDirection(tangentV);
		var vectorx = tangentU.clone();
		vectorx.cross(tangentV);
		vectorx.multiplyScalar(-1);
		vectorx.normalize();
		nArrow.position.copy(pos);
		nArrow.setDirection(vectorx);
	} 

}

function setSurfacePoint() {
	if (showPoint) {
		scene.add(curvePoint);
	} else {
		scene.remove(curvePoint);
	}
	if (showFrame) {
		scene.add(tArrow);
		scene.add(vArrow);
		scene.add(nArrow);
	} else {
		scene.remove(tArrow);
		scene.remove(vArrow);
		scene.remove(nArrow);
	}
}


function render() {
	//requestAnimationFrame( render );
	control.update();
	renderer.render(scene, camera);
}

function onDocumentTouchStart(event) {
	event.preventDefault();
	event.clientX = event.touches[0].clientX;
	event.clientY = event.touches[0].clientY;
	onDocumentMouseDown(event);
}

function onDocumentMouseDown(event) {
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(objects);
	if (intersects.length > 0) {
		SELECTED = intersects[0].object;
		scene.add(control);
		control.attach(SELECTED);
		//control.scale = 0.1;
	} else if (SELECTED !== null) {
		control.detach(SELECTED);
		//control.dispose();
		scene.remove(control);
		SELECTED = null;
	}
	render();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}


function saveSketchesFile() {
	var i, j;
	var n_ = Psurface.n + 1;
	var m_ = Psurface.m + 1;
	var retval = "";

	//Important placing!!!
	retval += `; Sketches Data File
; Do not edit this file!
[VERSION]
50
[PARAMETERS]
[FREE_CLUBS]
`;

	retval += (n_ * m_).toString() + "\n";
	for (i = 0; i < n_; i++) {
		for (j = 0; j < m_; j++) {
			retval += i.toString() + "00" + j.toString() + " " + Psurface.P[i][j].x.toString() + " ";
			retval += Psurface.P[i][j].y.toString() + " ";
			retval += Psurface.P[i][j].z.toString() + " 0 -1 0\n";
		}
	}

	//Important placing!!!
	retval += `[MAGNETIC_CLUBS]
0
[CURVES]
`;

	retval += (2 * n_ * m_ - n_ - m_).toString() + "\n";
	for (i = 0; i < n_; i++) {
		for (j = 0; j < m_ - 1; j++) {
			retval += i.toString() + "11" + j.toString() + " 0 0 0 0 -1 0 2 ";
			retval += i.toString() + "00" + j.toString() + " ";
			retval += i.toString() + "00" + (j + 1).toString() + "\n";
		}
	}
	for (i = 0; i < n_ - 1; i++) {
		for (j = 0; j < m_; j++) {
			retval += i.toString() + "11" + j.toString() + " 0 0 0 0 -1 0 2 ";
			retval += i.toString() + "00" + j.toString() + " ";
			retval += (i + 1).toString() + "00" + j.toString() + "\n";
		}
	}


	//Important placing!!!
	retval += `[SURFACES]
0
[AUXILIARY_CLUBS]
0
[INTERPOLATED_CLUBS]
0
[AUXILIARY_CURVES]
0
[SURFACE_CLUBS]
0
[TRIM_CURVES]
0
[PLANES]
0
[SKETCHBOX]
SKETCHBOX_SIZES=712x325x919
SKETCHBOX_CENTER=0x0x0
GRID=1,5,1
[VIEWS]
1
1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1
[COMPOSITION]

[MESHES]
0
[SPECTRUM]
0
0
[TEXTURE]
0
[PARAMETERS]
0 0
[HISTORY]
0 0
[END]
`;

	return retval;
}

function saveFile() {
	var retval = "";
	var i, j;
	retval += "TYPE " + "Psurface" + "\n";
	retval += "N " + Psurface.n.toString() + "\n";
	retval += "M " + Psurface.m.toString() + "\n";
	retval += "DU " + Psurface.du.toString() + "\n";
	retval += "DV " + Psurface.dv.toString() + "\n";
	for (i = 0; i < Psurface.knotsU.length; i++) {
		retval += "KNOTU " + Psurface.knotsU[i].toString() + "\n";
	}
	for (i = 0; i < Psurface.knotsV.length; i++) {
		retval += "KNOTV " + Psurface.knotsV[i].toString() + "\n";
	}
	for (i = 0; i <= Psurface.n; i++) {
		for (j = 0; j <= Psurface.m; j++) {
			retval += "CP " + Psurface.P[i][j].x.toString() + " ";
			retval += Psurface.P[i][j].y.toString() + " ";
			retval += Psurface.P[i][j].z.toString() + "\n";
		}
	}
	return retval;
}

function loadSurface(content) {
	var lines = content.split('\n');
	var CP_ = [];
	var knotsU_ = [];
	var knotsV_ = [];
	var du_, dv_, type_, n_, m_, i, j;
	var cpIndex = 0;
	for (i = 0; i < lines.length; i++) {
		var tokens = lines[i].split(" ");
		if (tokens[0] === "TYPE") {
			type_ = tokens[1];
		} else if (tokens[0] === "DU") {
			du_ = parseFloat(tokens[1]);
		} else if (tokens[0] === "DV") {
			dv_ = parseFloat(tokens[1]);
		} else if (tokens[0] === "N") {
			n_ = parseInt(tokens[1]);
			for (j = 0; j <= n_; j++) {
				CP_.push([]);
			}
		} else if (tokens[0] === "M") {
			m_ = parseInt(tokens[1]);
		} else if (tokens[0] === "KNOTU") {
			knotsU_.push(parseFloat(tokens[1]));
		} else if (tokens[0] === "KNOTV") {
			knotsV_.push(parseFloat(tokens[1]));
		} else if (tokens[0] === "CP") {
			//j = cpIndex % (n_+1);
			var rownum = Math.floor(cpIndex / (m_ + 1));

			CP_[rownum].push(new THREE.Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));
			cpIndex++;
		}
	}

	P = CP_;
	n = n_;
	m = m_;
	parameters.du = du_;
	parameters.dv = du_;
	Psurface = new JSCAGD.PSurface(CP_, n_, m_, du_, dv_, knotsU_, knotsV_);
	scene.remove(surfaceMesh);
	scene.remove(controlNet);
	drawSurface();
	render();
}
})();