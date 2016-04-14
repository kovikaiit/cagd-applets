
"use strict";

function BernsteinBase(i, n, u) {
	var temp = [];
	var k, j;
	for (k = 0; k <= n; k++) 
	{
	    temp.push(0.0);
	}
	temp[n - i] = 1.0;
	var u1 = 1.0 - u;
	for  (k = 1; k <= n; k++) 
	{
	   for (j = n; j>=k; j--) 
	   {
	       temp[j] = u1 * temp[j] + u * temp[j-1];
	   }
	}
	return temp[n];
}

function AllBernstein(n, u) 
{
    var B = [];
    var k, j;
	for (k = 0; k <= n; k++) 
	{
	    B.push(0.0);
	}
    B[0] = 1.0;
    var u1 = 1.0 - u;
    for (j = 1; j <= n; j++) {
        var saved = 0.0;
        for (k = 0; k < j; k++) {
            var temp = B[k];
            B[k] = saved + u1 * temp;
            saved = u * temp;
        }
        B[j] = saved;
    }
    return B;
}


function deCasteljau1(P, n, u)
{ 							
	var Q = [];
	var i, k;					
	for (i = 0; i <= n; i++) 
	{
		Q.push(P[i].clone()); 
	}	
	for (k = 1; k <= n; k++)
	{
		for (i = 0; i <= n - k; i++)
		{
			Q[i].multiplyScalar(1.0 - u);
			Q[i].addScaledVector(Q[i+1], u);
			//Q[i] = (1.0-u)*Q[i] + u*Q[i+1]; 
		}	
	}
	return Q[0];
}


// Not tested yet
function deCasteljauSurface(P, n, m, u0, v0)
{
	var Q = [];
	var i, j;
	if (n <= m)
	{
		for (j = 0; j <= m; j++)
		{
			Q[j] = deCasteljau1(P[j], n, u0);
		}
		return deCasteljau1(Q, m, v0);
	}
	else
	{
		for (i = 0; i <= n; i++)
		{
			var PT = new Array();
			for (j = 0; j <= n; j++)
			{
				PT.push(P[j][i]);
			}
			Q[i] = deCasteljau1(PT, m, v0);
		}
		return deCasteljau1(Q, n, u0);
	}	
}



function PointOnBezierCurve(P, n, u)
{ 
	var B = AllBernstein(n, u);
	var C = new THREE.Vector3(0.0, 0.0, 0.0);
	var k;
	for (k = 0; k <= n; k++) 
	{
		C.addScaledVector(P[k], B[k]);
	}
	return C;
}

function PointOnBezierSurface(P, n, u, v)
{ 
	var Bu = AllBernstein(n, u);
	var Bv = AllBernstein(n, v);
	var C = new THREE.Vector3(0.0, 0.0, 0.0);
	for (k = 0; k <= n; k++) 
	{
		for (l = 0; l <= n; l++) 
		{
			C.addScaledVector(P[k][l], Bu[k]*Bv[l]);
		}
	}
	return C;
}




var BezierCurve = THREE.Curve.create(
	function(P, n) { //custom curve constructor
		this.P = P;
		this.n = n;
	},

	function(t) { //getPoint: t is between 0-1
		//return PointOnBezierCurve(this.P, this.n, t);
		return deCasteljau1(this.P, this.n, t);
	}
);








