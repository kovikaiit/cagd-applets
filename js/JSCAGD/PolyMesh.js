"use strict";


var JSCAGD = JSCAGD || {};


JSCAGD.PolyMesh = function (V, T) {
	this.T = T;
	this.V = V;
	this.n = V.length;
	this.m = T.length;
};

JSCAGD.PolyMesh.prototype.constructor = JSCAGD.PolyMesh;


JSCAGD.PolyMesh.prototype.build = function() {
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


JSCAGD.PolyMesh.prototype.updateVertices = function(V) {
	for (var i = 0; i < this.n; i++) {
		this.V[i].copy(V[i]); 
	}
};