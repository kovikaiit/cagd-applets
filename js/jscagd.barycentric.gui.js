"use strict";

/* globals JSCAGD */
/* globals THREE */
/* globals dat */
/* globals MeshEditor */


(function() {
	var container;
	var scene, camera, renderer;
	var material, dashedmaterial, pointmaterial, movingpointmaterial;
	var orbit;
	var mesh;
	var raycaster;
	var pointColor;
	var gui;
	var parameters;

	var editor;
	var planemesh, planegeom, planeobj;
	var SELECTED;

	init();
	render();

	function hideGUIElem(datguielement) {
		datguielement.domElement.parentNode.parentNode.style.display = 'none';
	};

	function showGUIElem(datguielement) {
		datguielement.domElement.parentNode.parentNode.style.display = 'block';
	};


	function handleColorChange ( color ) {
		return function ( value ){
			if (typeof value === "string") {
				value = value.replace('#', '0x');
			}
			color.setHex( value );
	    };
	}

	function init() {

		// Scene and camera
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 100000);
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
		//orbit.enableZoom = false;

		// Materials
		//var isotexture = new THREE.ImageUtils.loadTexture( "isophotes.png" );
		//isotexture.wrapS = THREE.RepeatWrapping;
		//isotexture.wrapT = THREE.RepeatWrapping;
		//isotexture.repeat.set( 4, 4 );

		//material = new THREE.MeshBasicMaterial( {envMap: isotexture, reflectivity: 100.0, side: THREE.DoubleSide, color: 0xffffff, shading:THREE.SmoothShading} );

		


		initMesh();
		
		initGui();
		initPlane();


		window.addEventListener('resize', onWindowResize, false);
		renderer.render(scene, camera);


	}

	function initGui() {
		gui = new dat.GUI();

		parameters = {
			u: 0.5, // numeric slider
			v: 0.5,
			du: 0.5,
			dv: 0.5,
			resolution: 50,
			color: meshParameters.pointmaterial.color.getHex()
		};

		pointColor = gui.addColor(parameters, 'color').name("Point color");
		pointColor.onChange( 
			function ( value ) {
				handleColorChange( SELECTED.material.color )(value);
				refreshPlane();
				render();

		});
		hideGUIElem(pointColor);


		var resolution = gui.add(parameters, 'resolution').min(10).max(150).step(1).name('Resolution');
		resolution.onFinishChange(function() {
			 resetPlane() 
			render();
		});

		//gui.add(parameters, 'exportToOBJ').name("Export OBJ");
		//gui.add(parameters, 'exportToSTL').name("Export STL");

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
				mesh = JSCAGD.TriMesh.loadOBJ(contents);
				//mesh.build();
				//mesh.calcMeanCurvatures();

				scene.remove(editor);
				editor = new MeshEditor(mesh, camera, renderer,
					function() {
						render();
					},
				function() {
					SELECTED = editor.SELECTED;
					parameters.color = SELECTED.material.color.getHex();
					pointColor.updateDisplay();
					showGUIElem(pointColor);
				},
				function() {
					hideGUIElem(pointColor);
				});
				scene.add(editor);
				refreshPlane();
				render();
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

	function initMesh() {
		var tetraederV = [new THREE.Vector3(-100, -100, -100), new THREE.Vector3(200, 0, 0), new THREE.Vector3(0, 200, 0), new THREE.Vector3(0, 0, 200)];
		var tetraederT = [
			[0, 2, 1],
			[0, 3, 2],
			[0, 1, 3],
			[1, 2, 3]
		];
		//mesh = new JSCAGD.TriMesh(tetraederV, tetraederT);
		mesh = JSCAGD.FPSurface.genGridPolytope(4,4,30);
		//mesh.build();
		//mesh.calcMeanCurvatures();

		editor = new MeshEditor(mesh, camera, renderer,
			function() {
				refreshPlane();
				render();
			},
			function() {
				SELECTED = editor.SELECTED;
				parameters.color = SELECTED.material.color.getHex();
				pointColor.updateDisplay();
				showGUIElem(pointColor);
			},
			function() {
				hideGUIElem(pointColor);
			});
		scene.add(editor);
	}

	function initPlane() {

		var planematerial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
		planemesh = JSCAGD.TriMesh.genPlane(parameters.resolution);
		planegeom = planemesh.getTHREEGeometry();
		
		planeobj = new THREE.Mesh( planegeom, planematerial );
		scene.add(planeobj);
		refreshPlane();
	}

	function resetPlane() {
		planegeom.dispose();
		planemesh = JSCAGD.TriMesh.genPlane(parameters.resolution);
		planegeom = planemesh.getTHREEGeometry();
		planegeom.verticesNeedUpdate = true;
		planeobj.geometry = planegeom;
		refreshPlane();
	}

	function refreshPlane() {
		var barycentric = [];
		var i, k;
		for (i = 0; i < planemesh.n; i++) {
			var p = planemesh.V[i];
			var coordinates = JSCAGD.MeanValue.evalPolyMesh(mesh.V, mesh.T, p);
			//var coordinates = JSCAGD.MeanValue.evalTriMesh(mesh.V, mesh.T, p);
			
			var r = 0, g = 0, b = 0;
			for (var k = 0; k < coordinates.length; k++) {
				var ptcolor = editor.controlPoints[k].material.color;
				r += Math.max(coordinates[k], 0) * ptcolor.r;
				g += Math.max(coordinates[k], 0) * ptcolor.g;
				b += Math.max(coordinates[k], 0) * ptcolor.b;
			}
			var colorBary = new THREE.Color(Math.min(r, 1), Math.min(g, 1), Math.min(b,1));
			barycentric.push(colorBary);
			//console.log(JSCAGD.MeanValue.evalTriMesh(planemesh.V, planemesh.T, p));
		}
		for (i = 0; i < planemesh.m; i++) {
			for (k = 0; k < 3; k++) {
				planegeom.faces[i].vertexColors[k].copy( barycentric[planemesh.T[i][k]]);
			}
		}
		planeobj.geometry.colorsNeedUpdate = true;
	}


	function render() {
		//requestAnimationFrame( render );
		//control.update();
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
		editor.onMouseDown(event);
		render();
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}
})();