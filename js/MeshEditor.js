
"use strict";


/* globals THREE */

var meshParameters = {

		pointmaterial: new THREE.MeshLambertMaterial({
			color: 0xAA0000,
		}),

		dashedmaterial: new THREE.LineBasicMaterial({
			color: 0xAA0000,
			linewidth: 1
			//dashSize: 30,
			//gapSize: 20
		}),

		pointRadius: 0.15,

		sphereresolution: 5
};


var MeanToColor = function(x, d) {
	function componentToHex(c) {
		var hex = Math.round(c).toString(16);
    	return hex.length == 1 ? "0" + hex : hex;
	}
	if(x < 0) {
		var b = Math.min(-x / d, 1);
		var r = 0;
		var g = 1-b;
	} else {
		var r = Math.min(x / d, 1);
		var b = 0;
		var g = 1-r;
	}
	var clr = '#' + componentToHex(Math.floor(r * 255)) + componentToHex(g * 255)  + componentToHex(b * 255);
	console.log(clr);
	return new THREE.Color(r,g,b);
	//return new THREE.Color(clr);
};

var MeshEditor = function(mesh, camera, renderer, onChange) {

	//console.log(typeof this);
	THREE.Object3D.call(this);

	var that = this;
	var i;
	var spgeometry;
	var sphere;

	this.mesh = mesh;
	this.controlPoints = [];
	this.camera = camera;
	this.renderer = renderer;
	this.mouse = new THREE.Vector2();
	
	this.onChange = onChange;

	// Control point moving
	this.control3D = new THREE.TransformControls(this.camera, this.renderer.domElement);

	this.control3D.size = 0.5;

	this.control3D.addEventListener('change', function() {
		that.update();
		that.onChange(); //undefined??
	});


	this.control = this.control3D;


	// Raycasting for selection
	this.raycaster = new THREE.Raycaster();
	this.raycaster.params.Points.threshold = 0.1;

	this.controlPolygon = new THREE.Object3D();
	this.triangePatches = [];
	for (i = 0; i < this.mesh.T.length; i++) {
		var tri = this.mesh.T[i];
		var vertices = [this.mesh.V[tri[0]], this.mesh.V[tri[1]], this.mesh.V[tri[2]]];
		var trianglePolygon;
		trianglePolygon = new THREE.Geometry();
		trianglePolygon.vertices = vertices;
		var trianglePolygonPath = new THREE.Line(trianglePolygon, meshParameters.dashedmaterial);
		trianglePolygon.dynamic = true;
		trianglePolygonPath.dynamic = true;
		this.controlPolygon.add(trianglePolygonPath);
		this.triangePatches.push(trianglePolygon);
	}
	this.add(this.controlPolygon);

	this.cptContainer = new THREE.Object3D();
	// Control points
	for (i = 0; i < this.mesh.V.length; i++) {
		spgeometry = new THREE.SphereGeometry(meshParameters.pointRadius, meshParameters.sphereresolution, meshParameters.sphereresolution);
		sphere = new THREE.Mesh(spgeometry, meshParameters.pointmaterial);
		sphere.position.set(this.mesh.V[i].x, this.mesh.V[i].y, this.mesh.V[i].z);
		this.controlPoints.push(sphere);
		this.cptContainer.add(sphere);
	}
	//this.add(this.cptContainer);

	var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
	var geom = mesh.getGeometry();
	//geom.vertexColors = [];
	for (var i = 0; i < mesh.m; i++) {
		for (var k = 0; k < 3; k++) {
			geom.faces[i].vertexColors[k] = MeanToColor(mesh.V[mesh.T[i][k]].mean, 2);
		}
		
		//console.log()
	}
	this.clored = new THREE.Mesh( geom, material );
	this.add(this.clored);
};

MeshEditor.prototype = Object.create(THREE.Object3D.prototype);

MeshEditor.prototype.constructor = MeshEditor;

MeshEditor.prototype.update = function() {
	var i;
	for (i = 0; i < this.mesh.V.length; i++) {
		this.mesh.V[i] = this.controlPoints[i].position;
	}
	//this.controlPolygon.computeLineDistances();
	//this.controlPolygon.verticesNeedUpdate = true;
	//this.controlPolygon.lineDistancesNeedUpdate = true;
	for (i = 0; i < this.mesh.T.length; i++) {
		var tri = this.mesh.T[i];
		var vertices = [this.mesh.V[tri[0]], this.mesh.V[tri[1]], this.mesh.V[tri[2]]];
		this.triangePatches[i].vertices = vertices;
		this.triangePatches[i].verticesNeedUpdate = true;
	}

};

MeshEditor.prototype.render = function() {

	this.control.update();

};

MeshEditor.prototype.onMouseDown = function(event) {

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
