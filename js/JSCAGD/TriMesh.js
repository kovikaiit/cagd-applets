"use strict";

/* globals THREE */

var JSCAGD = JSCAGD || {};


JSCAGD.TriMesh = function (V, T) {
	this.T = T;
	this.V = V;
	this.n = V.length;
	this.m = T.length;
};

JSCAGD.TriMesh.prototype.constructor = JSCAGD.TriMesh;

JSCAGD.TriMesh.prototype.build = function() {
	this.edges = [];
	var inedgeData = [];
	var outedgeData = [];
	var edge, lastedge;
	var i, j, mi;
	for (i = 0; i < this.m; i++) {
		mi = this.T[i].length;
		for (j = 0; j < mi; j++) {
			edge = {
				vertex: this.T[i][j],
				face: this.T[i]
			};
			this.edges.push(edge);
			if(typeof this.V[this.T[i][j]].edge === 'undefined') {
				this.V[this.T[i][j]].edge = edge;
			}

			//tmp data
			if(typeof outedgeData[this.T[i][j]] === 'undefined') {
				outedgeData[this.T[i][j]] = [];
			}
			outedgeData[this.T[i][j]].push(edge);

			//tmp data
			if(typeof inedgeData[this.T[i][(j+1)%mi]] === 'undefined') {
				inedgeData[this.T[i][(j+1)%mi]] = [];
			}
			inedgeData[this.T[i][(j+1)%mi]].push(edge);


			if(j === 0) {
				this.T[i].edge = edge;
			} else {
				lastedge.next = edge;
			} 
			if(j === mi - 1) {
				edge.next = this.T[i].edge;
			} 
			lastedge = edge;
		}
	}
	// finalize opposite data
	var k;
	for (i = 0; i < this.n; i++) {
		if(typeof inedgeData[i] !== 'undefined') {
			for (j = 0; j < inedgeData[i].length; j++) {
				for (k = 0; k < outedgeData[i].length; k++) {
					if (inedgeData[i][j].vertex === outedgeData[i][k].next.vertex) {
						inedgeData[i][j].opposite = outedgeData[i][k];
						outedgeData[i][k].opposite = inedgeData[i][j];
					}
				}
			}
		}
	}
	for (i = 0; i < this.edges.length; i++) {
		var e = this.edges[i];
		if(typeof e.opposite === 'undefined') {
			this.V[e.vertex].edge = e;
		}
	}
};

JSCAGD.TriMesh.prototype.calcAreas = function() {
	var a, b, c, i;
	for (i = 0; i < this.m; i++) {
		a = this.V[this.T[i][0]];
		b = this.V[this.T[i][1]].clone();
		c = this.V[this.T[i][2]].clone();
		b.addScaledVector(a, -1);
		
		c.addScaledVector(a, -1);

		b.cross(c);

		this.T[i].area = b.length() / 2;
	}
};

JSCAGD.TriMesh.prototype.calcFaceNormals = function() {
	var a, b, c, i;
	for (i = 0; i < this.m; i++) {
		a = this.V[this.T[i][0]];
		b = this.V[this.T[i][2]].clone();
		c = this.V[this.T[i][1]].clone();
		b.addScaledVector(a, -1);
		b.normalize();
		c.addScaledVector(a, -1);
		c.normalize();
		b.cross(c);
		b.normalize();
		this.T[i].normal = b;
	}
};




JSCAGD.TriMesh.prototype.calcMeanCurvatures = function() {
	var a, b, i, n1, n2, v, edge, areasum, betasum;
	this.calcAreas();
	this.calcFaceNormals();
	var that = this;
	var halfedgeVector = function(halfedge) {
		a = that.V[halfedge.vertex];
		b = that.V[halfedge.next.vertex].clone();
		b.addScaledVector(a, -1);
		return b;
	};	


	for (i = 0; i < this.n; i++) {
		edge = this.V[i].edge;
		betasum = 0;
		areasum = 0;
		do {

			n1 = edge.face.normal.clone();
			if(typeof edge.opposite === 'undefined') {
				break; //TODO: boundary vertices
			}
			n2 = edge.opposite.face.normal.clone();
			v = halfedgeVector(edge);
			var beta = Math.acos(Math.min(n1.dot(n2),1));
			beta *= n1.cross(n2).dot(v) >= 0.0 ? 1.0 : -1.0;
			betasum += beta*v.length();
			areasum += edge.face.area;
			edge = edge.opposite.next;
		}
		while(edge !== this.V[i].edge);
		this.V[i].mean = 3/4 * betasum/areasum;
	}
};


//JSCAGD.TriMesh.prototype.getNeighbours = function(i) {
//	var neighbours = [];
//	return;
//};

JSCAGD.TriMesh.prototype.getTHREEGeometry = function() {
	var geometry = new THREE.Geometry(); 
	geometry.vertices = this.V;
	for (var i = 0; i < this.m; i++) {
		geometry.faces.push( new THREE.Face3( this.T[i][0], this.T[i][1], this.T[i][2] ) );
	}
	geometry.computeBoundingSphere();
	if(typeof this.uvs !== 'undefined') {
		for (i = 0; i < this.m; i++) {
			geometry.faceVertexUvs[0].push ([this.uvs[this.T[i][0]], this.uvs[this.T[i][1]], this.uvs[this.T[i][2]]]);
		}
	}
	for (var i = 0; i < this.m; i++) {
		for (var k = 0; k < 3; k++) {
			geometry.faces[i].vertexColors[k] = new THREE.Color();
		}
	}
	return geometry;
};

JSCAGD.TriMesh.prototype.updateVertices = function(V) {
	for (var i = 0; i < this.n; i++) {
		this.V[i].copy(V[i]); 
	}
};


JSCAGD.TriMesh.loadOBJ = function(content) {
	var lines = content.split('\n');
	var V = [];
	var F = [];
	for (var i = 0; i < lines.length; i++) {
		var tokens = lines[i].split(" ");
		if (tokens[0] === "f") {
			F.push([parseInt(tokens[1]) - 1, parseInt(tokens[2]) - 1, parseInt(tokens[3]) - 1]);
		} else if (tokens[0] === "v") {
			V.push(new JSCAGD.Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));
		}
	}
	var mesh = new JSCAGD.TriMesh(V, F);
	mesh.build();
	return mesh;
};

JSCAGD.TriMesh.prototype.saveOBJ = function() {
	var output = "# Wavefront OBJ file\n";
	output += "\n";
	output += "# "+ this.n + "vertices\n";
	for (var i = 0; i < this.n; i++) {
		var v = this.V[i];
		output += "v " + v.x + " " + v.y + " " + v.z + "\n";
	}
	output += "\n";
	output += "# "+ this.m + "faces\n";
	for (i = 0; i < this.m; i++) {
		var f = this.T[i];
		output += "f " + (f[0]+1) + " " + (f[1]+1) + " " + (f[2]+1) + "\n";
	}
	return output;
};

// TODO
JSCAGD.TriMesh.genPlane = function(res) {
	var i, j, u, v, t0, t1, t2, t3;
	var V = [];
	var T = [];
	var uvs = [];
	var diff = 1 / (res - 1);
	for (i = 0; i < res; i++) {
		for (j = 0; j < res; j++) {
			u = i*diff;
			v = j*diff;
			uvs.push(new THREE.Vector2(u, v));
			V.push(new THREE.Vector3(400*u -200, 400*v-200, 0));
			if(i !== res-1 && j !== res-1) {
				t0 = i*res + j;
				t1 = i*res + j + 1;
				t2 = (i+1)*res + j;
				t3 = (i+1)*res + j+1;
				T.push([t0, t1, t2], [t2, t1, t3]);
			}		
		}
	}
	var mesh = new JSCAGD.TriMesh(V, T);
	mesh.uvs = uvs;
	mesh.build();
	return mesh;
};


