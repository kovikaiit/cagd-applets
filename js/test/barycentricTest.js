load('../three.min.js');
load('../JSCAGD/JSCAGD.js');
load('../JSCAGD/MeanValueBarycentric.js');
load('../JSCAGD/TriMesh.js');

var tetraederV = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];
var tetraederT = [[0,1,2], [0, 2, 3], [0, 3, 1], [1, 3, 2]];
var x = new THREE.Vector3(0.01, 0.8, 0.01);

debug(JSCAGD.MeanValue.evalTriMesh(tetraederV, tetraederT, x));
debug(JSCAGD.MeanValue.evalPolyMesh(tetraederV, tetraederT, x));

function loadOBJ(content) {
	var lines = content.split('\n');
	var V = [];
	var F = [];
    for(var i = 0; i < lines.length; i++){
    	var tokens = lines[i].split(" ");
		if(tokens[0] === "f") {
      		F.push([parseInt(tokens[1]), parseInt(tokens[2]), parseInt(tokens[3])]);
      	}  else if(tokens[0] === "v") {
      		V.push(new THREE.Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));
      	} 
    }
    return {F: F, V: V};
}

var testOBJ = 
`v 0 0 0
v 1 0 0
v 0 1 0 
v 0 0 1
f 1 2 3
f 1 3 4
f 1 4 2
f 2 4 3`;

var mesh = JSCAGD.TriMesh.loadOBJ(testOBJ);
mesh.build();
mesh.calcMeanCurvatures();

debug(loadOBJ(testOBJ));





var negyszog = [new THREE.Vector2(0,0), new THREE.Vector2(1,0), new THREE.Vector2(2,2), new THREE.Vector2(0,1)];

var x = new THREE.Vector2(1.9, 1.8);
var bary = JSCAGD.MeanValue.eval(negyszog, x);
debug(bary);
var x0 = new THREE.Vector2(0, 0);
for (var i = 0; i < negyszog.length; i++) {
  x0.addScaledVector(negyszog[i], bary[i]);
}
debug(x0.x);
debug(x0.y);
