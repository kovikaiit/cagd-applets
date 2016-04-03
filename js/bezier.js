

function BernsteinBase(i, n, u)
{
	var temp = new Array();
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
    var B = new Array();
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


function PointOnBezierCurve(P, n, u)
{ 
	B = AllBernstein(n, u);
	var C = new THREE.Vector3(0.0, 0.0, 0.0);
	for (k = 0; k <= n; k++) 
	{
		C.addScaledVector(P[k], B[k]);
	}
	return C;
}

function PointOnBezierSurface(P, n, u, v)
{ 
	Bu = AllBernstein(n, u);
	Bv = AllBernstein(n, v);
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
    function ( P, n ) { //custom curve constructor
        this.P = P;
		this.n = n;
    },

    function ( t ) { //getPoint: t is between 0-1
        return PointOnBezierCurve(this.P, this.n, t);
    }
);
