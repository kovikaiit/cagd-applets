"use strict";

/* globals JSCAGD */
/* globals THREE */
/* globals dat */

// General control net handler for curves and surfaces

var is2D = true;
var is3D = !is2D;

function handleColorChange ( color ) {

	return function ( value ){

		if (typeof value === "string") {

			value = value.replace('#', '0x');

		}

		color.setHex( value );

    };

}

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
	var gui, optionsGui, triggerHide;
	var controlNet;
	var curve;
	var cEditor;
	var orbit;
	var bsCurves;
	//var getCurvature;
	var knotclosed = false;
	var camera2D, camera3D, directionalLight, grid3D;

	var knotScene, knotCamera, knotContainer, knotRenderer;
	var parameterD, insertKnot, curveDegree, elevateDegree, typeChange, params;
	init();

	render();


	function init() {

		// Scene and camera
		scene = new THREE.Scene();
		camera3D = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 10000);
		camera3D.position.set(0, -2000, 800);
		camera3D.lookAt(new THREE.Vector3(0,0,0));

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

				orbit.addEventListener( 'change', render );


		} 
		
		initCurve();

		initGui();

		initOptionsGui();
		initKnotEditor();


		

		window.addEventListener('resize', onWindowResize, false);
		renderer.render(scene, camera);

	}


	function initKnotEditor() {
		var width = 500;
		var height = 300;
		// Scene and camera
		knotScene = new THREE.Scene();
		knotCamera = new THREE.OrthographicCamera( -width/2, width/2, height/2, -height/2, 10, 10000 );
		knotCamera.position.set(-2000, 0, 0);
		knotCamera.lookAt(new THREE.Vector3());


		// Renderer
		knotRenderer = new THREE.WebGLRenderer({
			antialias: true
		});
		knotRenderer.setPixelRatio(window.devicePixelRatio);
		knotRenderer.setClearColor(0xffffff);
		knotRenderer.setSize(width, height);

		// Div container
		knotContainer = document.getElementById('knotView');
		knotContainer.appendChild(knotRenderer.domElement);

		
		bsCurves = new BaseFunctionCurves(curve, width, height);

		knotScene.add(bsCurves);

		knotRenderer.render(knotScene, knotCamera);

		resetDragger();

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
		var P = [p0, p1, p2, p3, p4, p5, p6];
		var n = 6;
		curve = new JSCAGD.MeanCurve(P, n, 0.2);
		

		cEditor = new CurveEditor(curve);
		scene.add(cEditor);
		

		controlNet = new ControlNet(curve, camera, renderer,
			function() {
				cEditor.update();
				cEditor.updateCurvePoint();
				render();
			});
		scene.add(controlNet);
	}

	function resetDragger() {
		var knotDragger = new KnotDragger(curve, function() {
			cEditor.update();
			bsCurves.update();
			cEditor.updateCurvePoint();
			render();
		});
	}

	function initGui() {
		gui = new dat.GUI({ width: 512, resizable : false });
		params = {
			p: 3,
			curv: 0
		};
		typeChange = gui.add(curve, 'curvetype', [ 'Bézier' , 'B-spline', 'P-curve' ] ).name('Curve type');

		//var typeChange = gui.add(curve, 'curvetype', [ 'P-curve', 'meang1test', 'meang1', 'meang0', 'cyclicInf', 'cyclicTricky', 'Bézier' , 'B-spline' ] ).name('Curve type');
		typeChange.onChange(function(value) {
			
			if(curve.curvetype === 'Bézier') {
				hideGUIElem(curveDegree);
				hideGUIElem(parameterD);
				hideGUIElem(insertKnot);
				showGUIElem(elevateDegree);
				curve.setDegree(curve.n);
				resetDragger();
			} else if(curve.curvetype === 'B-spline') {
				hideGUIElem(parameterD);
				showGUIElem(curveDegree);
				hideGUIElem(insertKnot);
				curve.setDegree(params.p);
				resetDragger();
				
			} else {
				showGUIElem(parameterD);
				showGUIElem(insertKnot);
				hideGUIElem(curveDegree);
				hideGUIElem(elevateDegree);
				resetDragger();
				bsCurves.resetGeometry(curve);
			}
			cEditor.reset();
			cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.update();
			render();
		});

		parameterD = gui.add( cEditor, 'd' ).min(0).max(10).step(0.01).name('d');
		parameterD.onChange(function(value) {
			curve.setD(cEditor.d);
			cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.update();
			render();
		});
		//parameterD.domElement.parentNode.parentNode.style.display = 'block';


		curveDegree = gui.add(params, 'p').min(1).max(10).step(1).name('Degree (p)');
		curveDegree.onChange(function() {
			if (curve.p != params.p) {
				curve.setDegree(params.p);
				cEditor.reset();
				cEditor.update();
				cEditor.updateCurvePoint();
				bsCurves.resetGeometry(curve);
				resetDragger();
				render();
			}

		});
		hideGUIElem(curveDegree);

		var parameter = gui.add(cEditor, 't').min(0).max(1).step(0.001).name('Parameter (t)');
		parameter.onChange(function() {
			cEditor.updateCurvePoint();

			render();
			//params.curv = JSCAGD.NumDer.getCurvature(curve, cEditor.t);
		});



		//var curvParam = gui.add(params, 'curv').step(0.0001).name('Curvature').listen();

		var showKnots = gui.add(cEditor, 'showKnots').name('Knots on the curve');
		showKnots.onChange(function() {
			cEditor.setShow();
			render();
		});

		var showPoint = gui.add(cEditor, 'showPoint').name('Moving point at t');
		showPoint.onChange(function() {
			cEditor.setShow();
			render();
		});

		var showCurf = gui.add(cEditor, 'showCurv').name('Curvature fence');
		showCurf.onChange(function() {
			cEditor.setShow();
			render();
		});

		var showFrame = gui.add(cEditor, 'showFrame').name('Frenet frame');
		showFrame.onChange(function() {
			cEditor.setShow();
			render();
		});

		var showCirc = gui.add(cEditor, 'showCirc').name('Osculating circle');
		showCirc.onChange(function() {
			cEditor.setShow();
			render();
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
				orbit.addEventListener( 'change', render );
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
			resetDragger();
			render();
		}};

		elevateDegree = gui.add(evelateDegreeFun,'preform').name('Degree elevation');
		//hideGUIElem(elevateDegree);

		var insertKnotFun = { add:function(){ 
			curve.insertKnot(cEditor.t); 
			cEditor.update(); 
			controlNet.reset(camera); 
			bsCurves.resetGeometry(curve);
			resetDragger();
			render();
		}};


			

		var plusD = function (e) { 
			e = e || event
			if(e.keyCode === 187 || e.keyCode === 3 || e.keyCode === 107) {
				if (curve.curvetype==='B-spline') {
					curveDegree.setValue(params.p + 1);
				} else if (curve.curvetype === 'P-curve') {
					parameterD.setValue(cEditor.d + 0.2);
				} 
			} else if (e.keyCode === 189 || e.keyCode === 109){
				if (curve.curvetype==='B-spline') {
					curveDegree.setValue(params.p - 1);
				} else if (curve.curvetype === 'P-curve' ) {
					parameterD.setValue(cEditor.d - 0.2);
				}
			} else if (e.keyCode === 39) {
				parameter.setValue(cEditor.t + 0.01)
			} else if (e.keyCode === 37) {
				parameter.setValue(cEditor.t - 0.01)
			} else if (e.keyCode === 79) {
				triggerHide();
			}
		}
		document.onkeydown = plusD;

		insertKnot = gui.add(insertKnotFun,'add').name('Insert knot');
		showGUIElem(curveDegree);
		hideGUIElem(parameterD);
		hideGUIElem(insertKnot);
		hideGUIElem(elevateDegree);
		gui.open();

		var x = gui.domElement.getElementsByTagName("ul"); // dangeruos, not too nice solution !!
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

	function initOptionsGui() {
		optionsGui = new dat.GUI({ width: 300, resizable : false });

		

		var radius = optionsGui.add(controlNetParameters,'pointRadius').min(1).max(20).step(1).name("CP Radius");
		radius.onChange(function() {
			controlNet.reset(camera); 
		});
		var data = {
		"backgroundColor" : "#f0f0f0",
		"CPcolor" : controlNetParameters.pointmaterial.color.getHex(),
		"curvecolor" : curveParameters.material.color.getHex()
		};

		var color = new THREE.Color();
		var colorConvert = handleColorChange( color );
		var cpColor = optionsGui.addColor(data, 'CPcolor').name("CP color");
		cpColor.onChange( handleColorChange( controlNetParameters.pointmaterial.color ) );
		var background = optionsGui.addColor(data, 'backgroundColor').onChange( function ( value ) {
			colorConvert( value );
			renderer.setClearColor( color.getHex() );
		} );
		var curveColor = optionsGui.addColor(data, 'curvecolor').name("Curve color");
		curveColor.onChange( handleColorChange( curveParameters.material.color ) );
		var radius = optionsGui.add(curveParameters,'tuberadius').min(0.1).max(5).step(0.1).name("Curve thickness");
		radius.onChange(function() {
			cEditor.update();
		});
		var resolution = optionsGui.add(curveParameters,'curveResolution').min(10).max(1000).step(1).name("Curve resolution");
		resolution.onChange(function() {
			cEditor.update();
		});
		//var fenceresolution = optionsGui.add(curveParameters,'fenceResolution').min(10).max(1000).step(1).name("Curve resolution");
		//fenceresolution.onChange(function() {
		//	cEditor.update();
		//});
		//dat.GUI.hideableGuis.remove(optionsGui);

		var saveFileFun = { save:function() {
			var blob = new Blob([saveFile()], {type: "text/plain;charset=utf-8"});
			saveAs(blob, "curve.txt");
		}};
		optionsGui.add(saveFileFun,'save').name('Save curve');




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
		    loadCurve(contents);
		  };
		  reader.readAsText(file);
		}




		var x = optionsGui.domElement.getElementsByTagName("ul"); // dangeruos, not too nice solution !!
		var customLi = document.createElement("li");
		customLi.className = 'cr number openli';

		x[0].appendChild(customLi);

		customLi.appendChild(newInput);





		optionsGui.domElement.style.display = 'none';
		triggerHide = function (){
			var state = optionsGui.domElement.style.display;
			if(state === 'none') {
				optionsGui.domElement.style.display= ''; 
			} else {
				optionsGui.domElement.style.display = 'none';
			}
		}
	}

	function saveFile() {
		var retval = "";
		retval += "TYPE " + curve.curvetype + "\n";
		if (curve.curvetype === 'B-spline') {
			retval += "P " + curve.p.toString() + "\n";
			for (var i = 0; i < curve.U.length; i++) {
				retval += "KNOT " + curve.U[i].toString() + "\n";
			}
		} else if (curve.curvetype === 'P-curve')  {
			retval += "D " + curve.d.toString() + "\n";
			for (var i = 0; i < curve.knot.length; i++) {
				retval += "KNOT " + curve.knot[i].toString() + "\n";
			}
		}
		for (var i = 0; i < curve.P.length; i++) {
			retval += "CP " + curve.P[i].x.toString() + " " +curve.P[i].y.toString() + " " + curve.P[i].z.toString() + "\n";
		}
		return retval;
	}

	function loadCurve(content) {
		var lines = content.split('\n');
		var CP_ = [];
		var knots_ = [];
		var type_, d_, p_;
	    for(var i = 0; i < lines.length; i++){
	    	var tokens = lines[i].split(" ");
	      	if(tokens[0] === "TYPE") {
	      		type_ = tokens[1];
	      	} else if(tokens[0] === "D") {
	      		d_ = parseFloat(tokens[1]);
	      	} else if(tokens[0] === "P") {
	      		p_ = parseInt(tokens[1]);
	      	} else if(tokens[0] === "KNOT") {
	      		knots_.push(parseFloat(tokens[1]));
	      	}  else if(tokens[0] === "CP") {
	      		CP_.push(new THREE.Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));
	      	} 
	    }
	    if(type_ === "B-spline" && p_ !== 'undefined') {
	    	
	    	typeChange.setValue(type_);
	    	curve.n = CP_.length - 1; 
	    	//curve.U = knots_;
	    	curveDegree.setValue(p_);
	    	curve.setU(knots_);
	    	//console.log(knots_.toString());
	    	curve.P = CP_;
	    	//typeChange.setValue(type_);
	    	cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.resetGeometry(curve);
			controlNet.reset(camera); 
			resetDragger();
	    } else if(type_ === "Bézier" && p_ !== 'undefined') {
	    	
	    	curve.P = CP_;
	    	curve.n = CP_.length - 1; 
	    	typeChange.setValue(type_);
	    	
	    	cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.resetGeometry(curve);
			controlNet.reset(camera); 
			resetDragger();
	    } else if(type_ === "P-curve" && d_ !== 'undefined') {
	    	
	    	typeChange.setValue(type_);
	    	curve.n = CP_.length - 1; 
	    	//curve.U = knots_;
	    	//curveDegree.setValue(p_);
	    	
	    	curve.knot = knots_;
	    	//console.log(knots_.toString());
	    	curve.P = CP_;
	    	//typeChange.setValue(type_);
	    	parameterD.setValue(d_);
	    	cEditor.update();
			cEditor.updateCurvePoint();
			bsCurves.resetGeometry(curve);
			controlNet.reset(camera); 
			resetDragger();
	    } else {
	    	console.warn("Load faliure");
	    }
	    render();
	}


	function render() {
		//requestAnimationFrame(render);
		controlNet.render();
		renderer.render(scene, camera);
		knotRenderer.render(knotScene, knotCamera);
	}


	function onDocumentMouseDown(event) {
		event.preventDefault();
		controlNet.onMouseDown(event);
		render();
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



