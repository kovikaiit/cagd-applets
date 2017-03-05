
"use strict";


/* globals THREE */

var is3D = is3D || false;

var controlNetParameters = {

		pointmaterial: new THREE.MeshLambertMaterial({
			color: 0xAA0000,
		}),

		dashedmaterial: new THREE.LineBasicMaterial({
			color: 0xAA0000,
			linewidth: 1
			//dashSize: 30,
			//gapSize: 20
		}),

		pointRadius: 12,

		sphereresolution: 10
};

var ControlNet = function(geometry, camera, renderer, onChange) {

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
		//this.controlPolygon.computeLineDistances();
		this.controlPolygonPath = new THREE.Line(this.controlPolygon, controlNetParameters.dashedmaterial);
		this.controlPolygon.dynamic = true;
		this.controlPolygonPath.dynamic = true;
		this.add(this.controlPolygonPath);
	}

	this.cptContainer = new THREE.Object3D();
	// Control points
	for (i = 0; i <= this.geometry.n; i++) {
		spgeometry = new THREE.SphereGeometry(controlNetParameters.pointRadius, controlNetParameters.sphereresolution, controlNetParameters.sphereresolution);
		sphere = new THREE.Mesh(spgeometry, controlNetParameters.pointmaterial);
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
	//this.controlPolygon.computeLineDistances();
	this.controlPolygon.verticesNeedUpdate = true;
	//this.controlPolygon.lineDistancesNeedUpdate = true;

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
	for( var i = this.controlPoints.length - 1; i >= 0; i--) { 
		var obj = this.controlPoints[i];
        obj.geometry.dispose(); 
        //obj.dispose(); 
 	}
	for( var i = this.children.length - 1; i >= 0; i--) { 
		var obj = this.children[i];
        this.remove(obj);
        //obj.dispose(); 
 	}
	// Control polygon for curves
	if (this.geometry.controlNetType === 'curve') {
		this.controlPolygon = new THREE.Geometry();
		this.controlPolygon.vertices = this.geometry.P;
		this.controlPolygon.computeLineDistances();
		this.controlPolygonPath = new THREE.Line(this.controlPolygon, controlNetParameters.dashedmaterial);
		this.controlPolygon.dynamic = true;
		this.controlPolygonPath.dynamic = true;
		this.add(this.controlPolygonPath);
	}

	this.controlPoints = [];

	// Control points
	this.cptContainer = new THREE.Object3D();
	for (i = 0; i <= this.geometry.n; i++) {
		var spgeometry = new THREE.SphereGeometry(controlNetParameters.pointRadius, controlNetParameters.sphereresolution, controlNetParameters.sphereresolution);
		var sphere = new THREE.Mesh(spgeometry, controlNetParameters.pointmaterial);
		sphere.position.set(this.geometry.P[i].x, this.geometry.P[i].y, this.geometry.P[i].z);
		this.controlPoints.push(sphere);
		this.cptContainer.add(sphere);
	}
	this.add(this.cptContainer);

	var	that = this;
	if(is3D) {
		this.control3D.dispose();
		this.control3D = new THREE.TransformControls(this.camera, this.renderer.domElement);
		this.control3D.size = 0.5;
		//this.control.dispose();
		this.control = this.control3D;
	} else {
		this.control2D.dispose();
		this.control2D = new THREE.DragControls( this.controlPoints, this.camera, this.renderer.domElement );
		//this.control.dispose();
		this.control = this.control2D;
	}
	this.control.addEventListener('change', function() {
		that.update();
		that.onChange(); 
	});

};
