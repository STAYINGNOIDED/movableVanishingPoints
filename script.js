var canvasW  = 1000;
var canvasH = 1000;

var canvas = document.createElement("canvas");
canvas.id = "theCanvas";
canvas.height = canvasH;
canvas.width  = canvasW;
document.body.appendChild(canvas);

var canvas1 = document.getElementById("theCanvas");
var ctx     = canvas1.getContext("2d");

var rForm   = [ document.getElementById("rx"), document.getElementById("ry") ];
var bForm   = [ document.getElementById("bx"), document.getElementById("by") ];
var gForm   = [ document.getElementById("gx"), document.getElementById("gy") ];

rForm[0].value = (canvasW/2)-5; rForm[1].value = 0; 
bForm[0].value = 0;             bForm[1].value = (canvasH/2)-5; 
gForm[0].value = canvasW-10;    gForm[1].value = (canvasH/2)-5; 

function reOffset(){
    var BB=canvas.getBoundingClientRect();
    offsetX=BB.left;
    offsetY=BB.top;        
}
var offsetX,offsetY;
reOffset();
window.onscroll=function(e){ reOffset(); }
window.onresize=function(e){ reOffset(); }
canvas.onresize=function(e){ reOffset(); }

undoPress = false;

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
canvas.onmousedown = MD; canvas.onmousemove = MM; canvas.onmouseup   = MU; canvas.onmouseout  = MO;
document.addEventListener("keydown", function(e){
	if ( e.keyCode == 13 ){ enterPress = true; depth = false; rects.push({t1:temp1, t2:temp2, t3:temp3}); temp1 = []; temp2 =[]; temp3 = []; document.exitPointerLock(); }});
document.addEventListener("keyup", function(e){
	if ( e.keyCode == 13 ){ enterPress = false; }});
document.addEventListener("keydown", function(e){
	if ( e.keyCode == 8 && !undoPress ) { undoPress = true; if( rects.length > 0 ){ rects.pop(); } } });
document.addEventListener("keyup", function(e){ if( e.keyCode == 8 ){ undoPress = false; } });

temp1   = [];
temp2   = [];
temp3   = [];
tempBox = [];

function Intersect(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
	var denominator, a, b, numerator1, numerator2, result = {
		x: null,
		y: null,
		onLine1: false,
		onLine2: false
	};
	denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
	if (denominator == 0) {
		return result;
	}
	a = line1StartY - line2StartY;
	b = line1StartX - line2StartX;
	numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
	numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
	a = numerator1 / denominator;
	b = numerator2 / denominator;
	result.x = line1StartX + (a * (line1EndX - line1StartX));
	result.y = line1StartY + (a * (line1EndY - line1StartY));
	if (a > 0 && a < 1) { result.onLine1 = true; }
	if (b > 0 && b < 1) { result.onLine2 = true; }
	return result;
};

function FindPoints(t1, t2, t3){
	
	vY = vPoints[0];
	vX = vPoints[1];
	vZ = vPoints[2];
	o  = vY.w/2;
	
	topRight   = Intersect( t1[0], t1[1], vZ.x+o, vZ.y+o, t2[0], t2[1], vX.x+o, vX.y+o );
	botLeft    = Intersect( t2[0], t2[1], vZ.x+o, vZ.y+o, t1[0], t1[1], vX.x+o, vX.y+o );
	uBRt       = Intersect( t2[0], t2[1], vY.x+o, vY.y+o, t2[0], t3[1], vZ.x+o, vZ.y+o );
	upBotRight  = Intersect( t2[0], t2[1], vY.x+o, vY.y+o, uBRt.x, uBRt.y, vX.x+o, vX.y+o );
	upTopRight = Intersect( topRight.x, topRight.y, vY.x+o, vY.y+o, upBotRight.x, upBotRight.y, vX.x+o, vX.y+o );
	upBotLeft = Intersect( botLeft.x, botLeft.y, vY.x+o, vY.y+o, upBotRight.x, upBotRight.y, vZ.x+o, vZ.y+o );
	upTopLeft  = Intersect( t1[0], t1[1], vY.x+o, vY.y+o, upBotLeft.x, upBotLeft.y, vX.x+o, vX.y+o );
	
	return {
		p1:  [ t1[0], t1[1] ],
		p2:  [ topRight.x, topRight.y ],
		p3:  [ t2[0], t2[1] ],
		p4:  [ botLeft.x, botLeft.y ],
		p4u: [ upBotLeft.x, upBotLeft.y ],
		p3u: [ upBotRight.x, upBotRight.y ],
		p2u: [ upTopRight.x, upTopRight.y ],
		p1u: [ upTopLeft.x, upTopLeft.y ],
	};
}

function Collision( coord ){
	for( i = 0; i < vPoints.length; i++ ){
		r = vPoints[i];
		if( ( coord[0] >= r.x && coord[0] <= r.x + r.w ) && ( coord[1] >= r.y && coord[1] <= r.y + r.h ) ){
			vPoints[i].drag = true;
			return true;
		}
	}
}

function ClearFlags(){
	for( i = 0; i < vPoints.length; i++ ){vPoints[i].drag = false;}
	drag    = false;
	draw    = false;
}

draw  = false;
drag  = false;
depth = false;

//MOUSE DOWN
function MD(e){
	e.preventDefault();
    e.stopPropagation();
	mx = parseInt(e.clientX-offsetX);
	my= parseInt(e.clientY-offsetY);
	
	if( depth ){ depth = false; rects.push({t1:temp1, t2:temp2, t3:temp3}); temp1 = []; temp2 =[]; temp3 = []; document.exitPointerLock(); }
	else{
	if( Collision( [mx, my] )){ drag = true; }
	else{ draw = true; }
	
	if( draw ){ temp1 = [ mx, my ]; }
	}
}
//MOUSE UP	
function MU(e){
	e.preventDefault();
    e.stopPropagation();
	mx = parseInt(e.clientX-offsetX);
	my = parseInt(e.clientY-offsetY);

	if( draw ){ depth = true; canvas.requestPointerLock(); }
	
	ClearFlags();
	}
//MOUSE OUT
function MO(e){
	e.preventDefault();
    e.stopPropagation();
	mx = parseInt(e.clientX-offsetX);
	my = parseInt(e.clientY-offsetY);
	
	if( draw ){ depth = true; canvas.requestPointerLock(); }
	
	ClearFlags();
}

y = 0;

//MOUSE MOVE
function MM(e){
	e.preventDefault();
    e.stopPropagation();
	mx = parseInt(e.clientX-offsetX);
	my = parseInt(e.clientY-offsetY);
	
	if( depth ){
		y += e.movementY;
		temp3 = [0, y];
	}
	else{ y = my };
	
	if( drag ){ 
		for( var i = 0; i < vPoints.length; i++ ){
			if( vPoints[i].drag ){
				vPoints[i].xForm.value = mx;
				vPoints[i].yForm.value = my;
				return;
			}
		}
	}
	
	if( draw ){ temp2 = [ mx, my ]; }
}

function DrawRectangle(context, rect){
	context.beginPath();
	context.rect(rect.x, rect.y, rect.w, rect.h);
	context.fillStyle = rect.c;
	context.fill();
	context.closePath();
}

function DrawStroke(context, p1, p2, w){
	context.lineWidth = w;
	context.beginPath();
	context.moveTo( p1[0], p1[1] );
	context.lineTo( p2[0], p2[1] );
	context.stroke();
}

var rects = [];

var vPoints = [];
vPoints.push( { x:(canvasW/2)-5, y:0            , w:10, h:10, c:"red",   drag:false, xForm: rForm[0], yForm: rForm[1] } );
vPoints.push( { x:0            , y:(canvasH/2)-5, w:10, h:10, c:"blue",  drag:false, xForm: bForm[0], yForm: bForm[1] } );
vPoints.push( { x:canvasW-10   , y:(canvasH/2)-5, w:10, h:10, c:"green", drag:false, xForm: gForm[0], yForm: gForm[1] } );

draw = false;

function Loop(context) {
	console.log(rForm[0].value);
	vPoints[0].x = parseInt(rForm[0].value); vPoints[0].y = parseInt(rForm[1].value);
	vPoints[1].x = parseInt(bForm[0].value); vPoints[1].y = parseInt(bForm[1].value);
	vPoints[2].x = parseInt(gForm[0].value); vPoints[2].y = parseInt(gForm[1].value);
	
	context.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "gray";
	ctx.fillRect( 0, 0, canvasW, canvasH );
	for( var i = 0; i < vPoints.length; i++ ){ DrawRectangle( ctx, vPoints[i] ); }
	for( var i = 0; i < rects.length; i++ ){
		r = FindPoints( rects[i].t1, rects[i].t2, rects[i].t3 );
		DrawStroke(ctx, r.p1, r.p2, 2 );
		DrawStroke(ctx, r.p2, r.p3, 2 );
		DrawStroke(ctx, r.p3, r.p4, 2 );
		DrawStroke(ctx, r.p4, r.p1, 2 );
		DrawStroke(ctx, r.p1, r.p1u, 2 );
		DrawStroke(ctx, r.p2, r.p2u, 2 );
		DrawStroke(ctx, r.p3, r.p3u, 2 );
		DrawStroke(ctx, r.p4, r.p4u, 2 );
		DrawStroke(ctx, r.p1u, r.p2u, 2 );
		DrawStroke(ctx, r.p2u, r.p3u, 2 );
		DrawStroke(ctx, r.p3u, r.p4u, 2 );
		DrawStroke(ctx, r.p4u, r.p1u, 2 );
	}
	if( draw || depth ){
		tempBox = FindPoints(temp1, temp2, temp3);
		DrawStroke(ctx, tempBox.p1, tempBox.p2, 1 );
		DrawStroke(ctx, tempBox.p2, tempBox.p3, 1 );
		DrawStroke(ctx, tempBox.p3, tempBox.p4, 1 );
		DrawStroke(ctx, tempBox.p4, tempBox.p1, 1 );
		DrawStroke(ctx, tempBox.p1, tempBox.p1u, 1 );
		DrawStroke(ctx, tempBox.p2, tempBox.p2u, 1 );
		DrawStroke(ctx, tempBox.p3, tempBox.p3u, 1 );
		DrawStroke(ctx, tempBox.p4, tempBox.p4u, 1 );
		DrawStroke(ctx, tempBox.p1u, tempBox.p2u, 1 );
		DrawStroke(ctx, tempBox.p2u, tempBox.p3u, 1 );
		DrawStroke(ctx, tempBox.p3u, tempBox.p4u, 1 );
		DrawStroke(ctx, tempBox.p4u, tempBox.p1u, 1 );
	}
}

setInterval(Loop, 20, ctx);
