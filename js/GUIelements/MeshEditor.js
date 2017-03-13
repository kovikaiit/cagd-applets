
"use strict";


/* globals THREE */

var meshParameters = {

		material : new THREE.MeshBasicMaterial({transparent: true, opacity: 0.5, color: 0x0000AA}),

		pointmaterial: new THREE.MeshLambertMaterial({
			color: 0xAA0000,
		}),

		dashedmaterial: new THREE.LineBasicMaterial({
			color: 0xAA0000,
			linewidth: 1
			//dashSize: 30,
			//gapSize: 20
		}),

		pointRadius: 6,

		sphereresolution: 8
};


var MeanToColor = function(x, d) {
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
	return new THREE.Color(r,g,b);
};

var MeshEditor = function(mesh, camera, renderer, onChange, onSelect, onDeselect) {

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
	this.onSelect = onSelect;
	this.onDeselect = onDeselect;

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
		sphere = new THREE.Mesh(spgeometry, meshParameters.pointmaterial.clone());
		sphere.material.color = new THREE.Color('#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6));
		sphere.position.set(this.mesh.V[i].x, this.mesh.V[i].y, this.mesh.V[i].z);
		this.controlPoints.push(sphere);
		this.cptContainer.add(sphere);
	}
	this.add(this.cptContainer);

	//var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
	//this.geom = mesh.getTHREEGeometry();
	//for (i = 0; i < mesh.m; i++) {
	//	for (var k = 0; k < 3; k++) {
	//		this.geom.faces[i].vertexColors[k] = MeanToColor(mesh.V[mesh.T[i][k]].mean, 2);
	//	}
	//}
	//this.clored = new THREE.Mesh( this.geom, meshParameters.material );
	//this.add(this.clored);
};

MeshEditor.prototype = Object.create(THREE.Object3D.prototype);

MeshEditor.prototype.constructor = MeshEditor;

MeshEditor.prototype.update = function() {
	var i;
	for (i = 0; i < this.mesh.V.length; i++) {
		this.mesh.V[i].copy(this.controlPoints[i].position);
	}
	for (i = 0; i < this.mesh.T.length; i++) {
		var tri = this.mesh.T[i];
		var vertices = [this.mesh.V[tri[0]], this.mesh.V[tri[1]], this.mesh.V[tri[2]]];
		this.triangePatches[i].vertices = vertices;
		this.triangePatches[i].verticesNeedUpdate = true;
	}
	//this.geom.verticesNeedUpdate = true;
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
			this.onSelect(this.SELECTED);
		} else if (this.SELECTED !== null) {
			this.control.detach(this.SELECTED);
			this.remove(this.control);
			this.SELECTED = null;
			this.onDeselect();
		}
	
};
