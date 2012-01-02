//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              DC-PATH
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// implements dc-path%, as defined by  http://docs.racket-lang.org/draw/dc-path_.html

/* 
 * Each dc-path% has a single array of operations which specify an
 * open sub-path (openPath), and an array of closed sub-paths (closedPaths)
 * the object also tracks the min/max coordinates each time a path is modified, to easily retrieve bounding box info
 */
function dcPath(){
    this.openPath = false;
    this.closedPaths = new Array();
    this.minX = null;
    this.minY = null;
    this.maxX = null;
    this.maxY = null;
    return this;
}

dcPath.prototype.toString = function(){
    var str = "";
    var printPath = function(path){
        for(var i=0; i<path.length; i++){
            str += "ctx."+path[i].f+"("+path[i].args.map(Math.round).join(",")+");\n";
        }
    }
    
    // print out all the closed sub-paths first
    for(var i=0; i<this.closedPaths.length; i++) printPath(this.closedPaths[i]);
    printPath(this.openPath);
    return str;
};

// append : dc-path -> dc-path
// append closed paths, and add that.open to this.openPath via a lineTo
dcPath.prototype.append = function(p){
    this.closedPaths.append(p.closedPaths);
    // if they both have open paths... 
    // connect the end of this one to the start of the other via lineTo
    // then skip over the first instruction (ALWAYS a moveTo), since it becomes no-op
    if(this.openPath && p.openPath){
        this.lineTo(p.openPath[0].from);
        for(var i=1; i< p.openPath.length; i++) this.openPath.push(p.openPath[i]);
    // if this one has no open path, grab the other's
    } else if(!this.openPath){
        this.openPath = p.openPath;
    }
    
    // update bounding box args
    this.minX = Math.min(this.minX, p.minX);
    this.minY = Math.min(this.minY, p.minY);
    this.maxX = Math.max(this.maxX, p.maxX);
    this.maxY = Math.max(this.maxY, p.maxY);
};

// reverse : void -> void
// reverses all sub-paths
dcPath.prototype.reverse = function(){
    var oldClosed   = this.closedPaths;
    var oldOpen     = this.openPath;
    this.reset();
    var that = this;
    // reverse a single sub-path
    var reverseSubPath = function(subPath){
        for(var i=subPath.length-1; i > -1; i--){
            // close -> moveTo(from)
            if(subPath[i].f == CanvasRenderingContext2D.prototype.closePath){
                that.moveTo.apply(that, subPath[i].from);
            // curveTo -> curveTo(from[x,y], c3[x,y], c2[x,y])
            } else if(subPath[i].f == CanvasRenderingContext2D.prototype.bezierCurveTo){
                var c2 = subPath[i].args.slice(2,4);
                var c3 = subPath[i].args.slice(4);
                var args = c3.append(c2).append(subPath[i].from);
                that.curveTo.apply(that, args);
            // lineTo -> lineTo(from)
            } else if(subPath[i].f == CanvasRenderingContext2D.prototype.lineTo){
                that.lineTo.apply(that, subPath[i].from);
            // moveTo -> close()
            } else if(subPath[i].f == CanvasRenderingContext2D.prototype.moveTo){
                that.close();
            }
        }
    }

    // reverse every closed subPath (in reverse order)
    for(var i=oldClosed.length-1; i>-1; i--) reverseSubPath(oldClosed[i]);
    
    if(oldOpen){
        var start = oldOpen.last().to;
        that.moveTo(start[0], start[1]); // insert a moveTo operation to set the new start
        reverseSubPath(oldOpen.slice(1));// reverse the path, ignoring the moveTo operation at index 0
    }
};

// open : void -> Boolean
// if the openPath array is defined, and nonempty, we have an open path
dcPath.prototype.open = function(){
    return (this.openPath.length > 0);
};

// open : void -> void
// set openPath to false, closePaths to an empty array
dcPath.prototype.reset = function(){
    this.openPath = false;
    this.closedPaths = new Array();
    // nullify bounding box args
    this.minX = null;
    this.minY = null;
    this.maxX = null;
    this.maxY = null;
};

// get-bounding-box : void -> Real Real Real Real
// return the min and max coordinates
dcPath.prototype.getBoundingBox = function(){
    return [Math.round(this.minX), Math.round(this.minY),
            Math.round(this.maxX), Math.round(this.maxY)];
};

////////////////////////////////////// SUB-PATH PRIMITIVES /////////////////////////////////////
/*
 *  A sub-path is a defined as an array of *operations*, which are structs that include 
 *          1) f:    the canvas path function
 *          2) args: an array of arguments to the function
 *          3) from: the ending x,y coordinates of the _previous_ operation
 *          4) to:   the ending x,y coordinates of the operation
 *
 *  All sub-paths are made of these operations, which also update the bounding coordinates.
 *  There are FOUR operations: close(), curveTo(), lineTo() and moveTo(). Everything else
 *  is implemented based on calls to these four.
 */

// close : void -> void
// if there's an open path, add the closePath operation and push the array into closedPaths
dcPath.prototype.close = function(){
    if(!this.openPath) throw "exn:fail:contract -- there was no open path to close";
    this.openPath.push({f:      CanvasRenderingContext2D.prototype.closePath
                       ,args:   []
                       ,from:   this.openPath.last().to.slice(0) // pass by value, not ref
                       ,to:     this.openPath.last().to.slice(0)});
    this.closedPaths.push(this.openPath);
    this.openPath = false;
};

// curveTo : Real Real Real Real Real -> void
// Push the bezierCurveTo operation. ONLY valid if there's an open path.
dcPath.prototype.curveTo = function(cx1, cy1, cx2, cy2, x3, y3){
    if(!this.openPath) throw "exn:fail:contract -- there was no open path from which to extend a curve";
    
    this.openPath.push({f:      CanvasRenderingContext2D.prototype.bezierCurveTo
                       ,args:   [cx1, cy1, cx2, cy2, x3, y3]
                       ,from:   this.openPath.last().to.slice(0) // pass by value, not ref
                       ,to:     [x3, y3]});
    // update bounding box args. from the spec:
    // "the bounding box encloses the two control points as well as the start and end points"
    this.minX = Math.min(this.minX, cx1, cx2, x3);
    this.minY = Math.min(this.minY, cy1, cy2, y3);
    this.maxX = Math.max(this.maxX, cx1, cx2, x3);
    this.maxY = Math.max(this.maxY, cy1, cy2, y3);
};

// lineTo : Real Real -> void
// Push the lineeTo operation. ONLY valid if there's an open path.
dcPath.prototype.lineTo = function(x, y){
    if(!this.openPath) throw "exn:fail:contract -- there was no open path from which to extend a line";
    
    this.openPath.push({f:      CanvasRenderingContext2D.prototype.lineTo
                       ,args:   [x, y]
                       ,from:   this.openPath.last().to.slice(0) // pass by value, not ref
                       ,to:     [x, y]});
    // update bounding box args
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
};

// moveTo : Real Real -> void
// closes an open path (if one exists) and starts a new one by pushing a moveTo operation
dcPath.prototype.moveTo = function(x, y){
    if(this.openPath) this.close();
    
    this.openPath = new Array();
    this.openPath.push({f:      CanvasRenderingContext2D.prototype.moveTo
                       ,args:   [x, y]
                       ,from:   [x, y]
                       ,to:     [x, y]});    
    // update bounding box args
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
};

//////////////// Higher-level Subpath Operations /////////////////////////////

// lines : (Vector Points) Real Real -> void
// Push a series of lineTo operations. ONLY valid if there's an open path.
dcPath.prototype.lines = function(points, xOffset, yOffset){
    if(!this.openPath) throw "exn:fail:contract -- there was no open path from which to extend lines";
    if(xOffset == undefined) xOffset = 0;
    if(yOffset == undefined) yOffset = 0;
    
    for(var i=0; i<points.length; i++){
        this.lineTo(points[i].x+xOffset, points[i].y+yOffset);
    }
};


// ellipse : Real Real Real Real -> void
// closes an open path (if one exists), pushes the necessary operations for an ellipse,
// then closes the subpath
dcPath.prototype.ellipse = function(x, y, width, height){
    if(this.openPath) this.close();
    this.arc(x, y, width, height, 0, 2*Math.PI);
    this.close();
};

// arc : Real Real Real Real Real Real -> void
// if there is no open path, store a moveTo operation. Then add the arc operation
// this is essentially a javascript translation of Ben Deane's work on elbeno
// see https://github.com/xach/vecto/blob/master/arc.lisp
dcPath.prototype.arc = function(x, y, width, height, eta1, eta2){
    var that = this;
    
    // from the spec: a negative height or width means the upper-left corner must be
    // shifted by that amount, and the height and width become their absolute value
    if(width < 0){  x -=width;  width = -width; }
    if(height < 0){ y -=height; height = -height;}
    
    // if eta1=eta2, it's a no-op
    if(eta1 == eta2) return;

    // since the racket drawing spec puts 0.5PI at 12 o'clock, we treat eta2 as the
    // amount to SUBTRACT from eta1, which properly translates the angle
    var eta2 = 2*Math.PI-eta2;
    
    // make sure everything is within 0-2PI radians, and that eta1 is LARGER
    var eta1 = eta1 % (2*Math.PI), eta2 = eta2 % (2*Math.PI);
    if(eta1 <= eta2) eta1 += 2*Math.PI;

    // set up variables needed by the approximateArc function
    var a  = width/2, b  = height/2, cx = x+a, cy = y+b;
    
    // approximate the arc!
    approximateArc(cx, cy, a, b, eta1, eta2);
    
    // approximate an arc within an error by subdividing
    // return a list of beziers
    function approximateArc(cx, cy, a, b, eta1, eta2){
        if(eta1 < eta2) throw "approximateArc: eta2 must be bigger than eta1";
        else if(eta1-eta2 > Math.PI/2){                
            var etamid = eta1 - Math.PI/2;
            approximateArc(cx, cy, a, b, eta1, etamid);
            approximateArc(cx, cy, a, b, etamid, eta2);
        // if a single arc is NOT within acceptable error bounds (0.5), 
        // cut it in half and approximate the two sub-arcs
        } else if(bezierError(a, b, eta1, eta2) >= 0.5){
            var etamid = (eta1+eta2)/2;
            approximateArc(cx, cy, a, b, eta1, etamid);
            approximateArc(cx, cy, a, b, etamid, eta2);
        // otherwise, draw the darned thing!
        } else {
            var k = Math.tan((eta1-eta2)/2);
            var alpha = Math.sin(eta1-eta2) * (Math.sqrt(4 + 3*k*k) - 1) / 3;
            
            var p1x = cx  + a*Math.cos(eta1),
                p1y = cy  + b*Math.sin(eta1),
                p2x = cx  + a*Math.cos(eta2),
                p2y = cy  + b*Math.sin(eta2),
                c1x = p1x - -a*Math.sin(eta1)*alpha, 
                c1y = p1y - b*Math.cos(eta1)*alpha,
                c2x = p2x + -a*Math.sin(eta2)*alpha, 
                c2y = p2y + b*Math.cos(eta2)*alpha;
            
            if(!that.openPath) that.moveTo(p1x, p1y);
            that.curveTo(c1x, c1y, c2x, c2y, p2x, p2y);
        }
    }
        
    // compute the error of a cubic bezier that approximates an elliptical arc
    // with radii a, b between angles eta1 and eta2
    function bezierError(a, b, eta1, eta2){
        // coefficients for error estimation: 0 < b/a < 1/4
        var coeffs3Low = [
                          [[  3.85268,   -21.229,      -0.330434,    0.0127842  ],
                           [ -1.61486,     0.706564,    0.225945,    0.263682   ],
                           [ -0.910164,    0.388383,    0.00551445,  0.00671814 ],
                           [ -0.630184,    0.192402,    0.0098871,   0.0102527  ]]
                        , [[ -0.162211,    9.94329,     0.13723,     0.0124084  ],
                           [ -0.253135,    0.00187735,  0.0230286,   0.01264    ],
                           [ -0.0695069,  -0.0437594,   0.0120636,   0.0163087  ],
                           [ -0.0328856,  -0.00926032, -0.00173573,  0.00527385 ]]
                          ];
        
        // coefficients for error estimation: 1/4 <= b/a <= 1
        var coeffs3High = [
                           [[  0.0899116, -19.2349,     -4.11711,     0.183362   ],
                            [  0.138148,   -1.45804,     1.32044,     1.38474    ],
                            [  0.230903,   -0.450262,    0.219963,    0.414038   ],
                            [  0.0590565,  -0.101062,    0.0430592,   0.0204699  ]]
                         , [[  0.0164649,   9.89394,     0.0919496,   0.00760802 ],
                            [  0.0191603,  -0.0322058,   0.0134667,  -0.0825018  ],
                            [  0.0156192,  -0.017535,    0.00326508, -0.228157   ],
                            [ -0.0236752,   0.0405821,  -0.0173086,   0.176187   ]]
                           ];
        
        var calcCTerm = function(i, ratio, etasum, arr){
            var cTerm = 0;
            for(var j=0; j<4; j++){
                cTerm+= Math.cos(j*etasum) *
                        ((arr[i][j][0]*ratio^2 + arr[i][j][1]*ratio) + arr[i][j][2])
                        / (arr[i][j][3]+ratio);
            }
            return cTerm;
        }

        var ratio = b/a;
        var etadiff = eta2 - eta1;
        var etasum  = eta2 + eta1;
        var coeffs = (ratio < 0.25)? coeffs3Low : coeffs3High;
                  
        return (((0.001*ratio^2) + (4.98*ratio) + 0.207) / (ratio + 0.0067)) 
                * a 
                * Math.e^(calcCTerm(0, ratio, etasum, coeffs) 
                          + (calcCTerm(1, ratio, etasum, coeffs) * etadiff));
    }
    
};

// roundedRectangle : Real Real Real Real Integer -> void
dcPath.prototype.roundedRectangle = function(x, y, width, height, radius){ 
    // check to make sure the radius is valid
    // if radius is negative, use the absolute value as a proportion of the shortest side
    var shortestSide = Math.min(width, height);
    if(isNaN(radius) || (radius > .5*shortestSide) || (radius < -0.5)) throw "Exn:fail:contract";
    if(radius<0) radius = shortestSide*Math.abs(radius);
    
    // from http://nacho4d-nacho4d.blogspot.com/2011/05/bezier-paths-rounded-corners-rectangles.html
    var kappa = .5522848;
    var co = kappa * radius;                            // control offset

    this.moveTo(x+radius, y);
    this.lineTo(x+width-radius, y);
    this.curveTo(x+width-co, y, x+width, y+co, x+width, y+radius);
    this.lineTo(x+width, y+height-radius);
    this.curveTo(x+width, y+height-co, x+width-co, y+height, x+width-radius, y+height);
    this.lineTo(x+radius, y+height);
    this.curveTo(x+co, y+height, x, y+height-co, x, y+height-radius);
    this.lineTo(x, y+radius);
    this.curveTo(x, y+co, x+co, y, x+radius, y);
    this.close();
};

// rectangle : Real Real Real Real -> void
// implemented in terms of roundedRectangle
dcPath.prototype.rectangle = function(x, y, width, height){
    this.moveTo(x, y);
    this.lineTo(x+width, y);
    this.lineTo(x+width, y+height);
    this.lineTo(x, y+height);
    this.lineTo(x, y);
    this.close();
};
//////////////// Operations that transform the path /////////////////////////////

// mapPoints : (Real Real -> void) -> void
// _stateful_ implementation of map, which apply a function f to every 
// (x,y) pair in each Operation in each subpath
dcPath.prototype.mapPoints = function(f){
    
    var applyf = function(f){
        return function(op){
            if(op.f == CanvasRenderingContext2D.prototype.closePath){
                var from = f(op.from);
                var to = f(op.to);
            } else if(op.f == CanvasRenderingContext2D.prototype.bezierCurveTo){
                var c1 = f(op.args.slice(0,2));
                var c2 = f(op.args.slice(2,4));
                var p = f(op.args.slice(4,6));
                var args = c1.append(c2).append(p);
                var from = f(op.from);
                var to = f(op.to);
                
            } else if(op.f == CanvasRenderingContext2D.prototype.lineTo){
                var args = f(op.args);
                var from = f(op.from);
                var to = f(op.to);
                
            } else if(op.f == CanvasRenderingContext2D.prototype.moveTo){
                var args = f(op.args);
                var from = f(op.from);
                var to = f(op.to);
            }
            return {f: op.f, args: args, from: from, to: to};
        };
    };
    
    // make a function that knows how to apply f to any operation
    var f_applier = applyf(f);
    // map f over each operation in each closedPath
    for(var i=0; i<this.closedPaths.length; i++) {
        this.closedPaths[i] = this.closedPaths[i].map(f_applier);
    }
    // map f over each operation in the openPath
    this.openPath = this.openPath.map(f_applier);
};

// scale : Real Real -> void
// scale all points in the path
dcPath.prototype.scale = function(xScale, yScale){
    // scalePoint: [Real Real] -> void
    var scalePoint = function(point){
        return [point[0] * xScale, point[1] * yScale];
    }
    this.mapPoints(scalePoint);
};

// translate : Real Real -> void
// scale all points in the path
dcPath.prototype.translate = function(x, y){
    var translatePoint = function(point){
        return [point[0] + x, point[1] + y];
    }
    this.mapPoints(translatePoint);
};

// rotate : Real -> void
// rotate all points in the path
dcPath.prototype.rotate = function(radians){
    var rotatePoint = function(point){
        return [ Math.floor(Math.cos(radians) * point[0])
                ,Math.floor(Math.sin(radians) * point[1])];
    }
    this.mapPoints(rotatePoint);

};

//////////////// Given a 2D Context, Translate to a native path ///////////////////

// makeCanvasPath : CanvasRenderingContext2D -> void
// call each operation in a subpath with it's args, in the given CanvasRenderingContext
// We round to the nearest integer for speed (esp on cellphones, which have weak FP),
// and to reduce subpixel antialiasing
dcPath.prototype.makeCanvasPath = function(ctx){
    var translateSubPath = function(subPath){
        for(var i=0; i < subPath.length; i++) 
            subPath[i].f.apply(ctx, subPath[i].args.map(Math.round));
    }
    
    // translate all closed sub-paths, then the open path
    for(var i=0; i < this.closedPaths.length; i++)
        translateSubPath(this.closedPaths[i]);
    translateSubPath(this.openPath);
    
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              REGION
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// implements region%, as defined by http://docs.racket-lang.org/draw/region_.html


/* 
 * Each region% is basically a B&W canvas, whose transformations are set
 * at initialization or use by an associated DC. Bounding boxes are
 * determined by using the dcPath& object to draw into these canvases
 * and union/intersection/xoring is done through the canvas's native 
 * globalCompositeOperation
 */
function Region(dc){
    this.dc   = false;              // dc is false if one has not been initialized
    this.boundingBox = false;       // bounding box is also false if there's no path or dc
    
    // our hook into the native canvas element
    this.ctx  = document.createElement('canvas').getContext('2d');
    this.ctx.fillStyle = 'black';

    // if a DC is provided, copy it's dimensions and start out clipping the whole rectangle
    if(dc){
        this.ctx.canvas.width = dc.getWidth();
        this.ctx.canvas.height = dc.getHeight();
        this.dc = dc;
        this.setRectangle(0,0,dc.getWidth(), dc.getHeight());
    }
    
    // private method that actually does the compositing
    var that = this;

    // combine : Region String -> void
    // combine the two regions with the given globalCompositeOperation
    // The dc of both regions must be the same, or they must both be unassociated to any dc.
    function combine(rgn, operation){
        if(that.dc !== rgn.dc) throw "exn:fail:contract -- both regions must have the same DC to combine, or none at all";
        that.ctx.globalCompositeOperation = operation;
        that.ctx.drawImage(rgn.ctx.canvas,0,0);      // let the browser do the actual gruntwork
        // combine bounding boxes
        that.boundingBox[0] = Math.min(that.boundingBox[0], rgn.boundingBox[0]);
        that.boundingBox[1] = Math.min(that.boundingBox[1], rgn.boundingBox[1]);
        that.boundingBox[2] = Math.max(that.boundingBox[2], rgn.boundingBox[2]);
        that.boundingBox[2] = Math.max(that.boundingBox[3], rgn.boundingBox[3]);
    }
    
    // intersect : Region -> void
    // Set the region to the intersection of itself and another region
    this.intersect  = function(rgn){ combine(rgn, "source-in"); };
    
    // subtract : Region -> void
    // Set the region to the subtraction of another region from itself
    this.subtract   = function(rgn){ combine(rgn, "destination-out"); };

    // union : Region -> void
    // Set the region to the union of another region from itself
    this.union      = function(rgn){ combine(rgn, "source-over"); };
    
    // xor : Region -> void
    // Set the region to the xor of another region from itself
    this.xor        = function(rgn){ combine(rgn, "xor"); };

    // get-DC : void -> dc / false
    this.getDC      = function(){return this.dc};
    return this;
}


// get-bounding-box : void -> Real Real Real Real
// if there's a dc, return the min and max coordinates
// otherwise, return the tracked box
Region.prototype.getBoundingBox = function(){
    if(this.dc) return [0, 0, this.dc.getWidth(), this.dc.getHeight()];
    else return this.boundingBox;
};

// in-region? : Real Real -> Boolean
// TODO: Ask Matthew what points are part of an empty region not affiliated with a dc
Region.prototype.inRegion = function(x, y){
    // if there's a DC, transform the point first and then check the bounds
    if(this.dc){
        m = this.dc.getInitialMatrix();
        point = m.transformPoint(x, y);
        return (point[0]>=0 && point[0]<=this.dc.width &&
                point[1]>=0 && point[1]<=this.dc.height);
    // if not, check the bounding box first, then the individual pixel
    } else {
        var box = this.boundingBox;
        // if it's outside the box, return false
        if(!box || (x < box[0] && x > box[2] && y < box[1] && y > box[3])) return false;
        console.log('checking individual pixels');
        // otherwise, check the individual pixels of the bounding box
        var image  = this.ctx.getImageData(box[0], box[1], box[2], box[3]);
        var pixels = image.data;
        var index = y*box[2]+x; // flatten 2d index into a 1d index
        return (pixels[4*index+3] == 255); // is the pixel not alpha'd out?
    }
};

// isEmpty : void -> Boolean
// From the spec "Returns #t if the region is _approximately_ empty". If no DC is associated, throw an exception
// TODO: ask Matthew what _approximatly_ means
Region.prototype.isEmpty = function(rgn){
    if(!this.dc) throw "exn:fail:contract -- a region must have an attached DC to check if empty";
    else{
        var box = this.boundingBox;
        return box && (box[2] - box[0])*(box[3] - box[1]) < 4; // is the area of bounding box 4 pixels or less?
    }
};

// setArc : Real Real Real Real Real -> void
// Set the region to the arc specificed by x,y,w,h,eta1 and eta2. (Use a path)
Region.prototype.setArc = function(x, y, w, h, eta1, eta2){
    this.ctx.canvas.width = this.ctx.canvas.width;
    var p = new dcPath();
    p.arc(x, y, w, h, eta1, eta2);          // make the path
    p.makeCanvasPath(this.ctx);             // draw it in the current context
    this.ctx.fill();                        // fill with black
    this.boundingBox = p.getBoundingBox();  // update the new boundingBox
        
};

// setEllipse : Real Real Real Real Real -> void
// Set the region to the ellipse specificed by x,y,w,h. (Use a path)
Region.prototype.setEllipse = function(x, y, w, h){
    this.ctx.canvas.width = this.ctx.canvas.width;
    var p = new dcPath();
    p.ellipse(x, y, w, h);                  // make the path
    p.makeCanvasPath(this.ctx);             // draw it in the current context
    this.ctx.fill();                        // fill with black
    this.boundingBox = p.getBoundingBox();  // update the new boundingBox
    
};

// setPath : Path [Real Real fillStyle] -> void
// Set the region to the Path specificed, offset by x and y
// TODO: use fillStyle
Region.prototype.setPath = function(path, xOffset, yOffset, fillStyle){
    // winding => nonzero, odd-even => evenodd (currently only works on Mozilla 7+)
    if(fillStyle == undefined) fillStyle = "winding";
    if(fillStyle !== "winding") console.log("WARNING: Even-Odd fill rule is only supported on Mozilla 7+");
    this.ctx.mozFillRule = (fillStyle == "winding")? "nonzero" : "evenodd";

    this.ctx.canvas.width = this.ctx.canvas.width;
    p.translate(xOffset, yOffset);          // translate the path using the offsets
    p.makeCanvasPath(this.ctx);             // draw it in the current context
    this.ctx.fill();                        // fill with black
    this.boundingBox = p.getBoundingBox();  // update the new boundingBox
    
};

// setPolygon : (Vector points) Real Real fillStyle -> void
// Set the region to the polygon specificed by these points, offset by x and y. (Use a path)
Region.prototype.setPolygon = function(points, xOffset, yOffset, fillStyle){
    // winding => nonzero, odd-even => evenodd (currently only works on Mozilla 7+)
    if(fillStyle == undefined) fillStyle = "winding";
    this.ctx.mozFillRule = (fillStyle == "winding")? "nonzero" : "evenodd";

    this.ctx.canvas.width = this.ctx.canvas.width;
    if(xOffset == undefined) xOffset = 0;
    if(yOffset == undefined) yOffset = 0;
    var p = new dcPath();
    p.moveTo(points[0].x+xOffset, points[0].x+yOffset);
    p.lines(points, xOffset, yOffset);
    // close the polygon
    p.lineTo(points[0].x+xOffset, points[0].y+yOffset);
    p.close();

    p.makeCanvasPath(this.ctx);             // draw it in the current context
    this.ctx.fill();                        // fill with black
    this.boundingBox = p.getBoundingBox();  // update the new boundingBox
    
};

// setRectangle : Real Real Real Real -> void
// Set the region to the rectangle specificed by x,y,w,h. (Use a path)
Region.prototype.setRectangle = function(x, y, w, h){
    this.ctx.canvas.width = this.ctx.canvas.width;
    var p = new dcPath();
    p.rectangle(x, y, w, h);                // make the path
    p.makeCanvasPath(this.ctx);             // draw it in the current context
    this.ctx.fill();                        // fill with black
    this.boundingBox = p.getBoundingBox();  // update the new boundingBox
    
};

// setRoundedRectangle : Real Real Real Real Real -> void
// Set the region to the rectangle specificed by x,y,w,h, with radius r. (Use a path)
Region.prototype.setRoundedRectangle = function(x, y, w, h, r){
    this.ctx.canvas.width = this.ctx.canvas.width;
    var p = new dcPath();
    p.roundedRectangle(x, y, w, h, r);      // make the path
    p.makeCanvasPath(this.ctx);             // draw it in the current context
    this.ctx.fill();                        // fill with black
    this.boundingBox = p.getBoundingBox();  // update the new boundingBox
    
};