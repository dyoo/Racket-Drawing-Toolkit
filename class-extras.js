// allow Strings to un-ligature themselves
String.prototype.removeLigatures = function(){
    var result = "";
    for(var i=0; i<this.length; i++){
             if(this.charCodeAt(i) == 64260)    result+="ffl";  // ﬄ
        else if(this.charCodeAt(i) == 64259)    result+="ffi";  // ﬃ
        else if(this.charCodeAt(i) == 64258)    result+="fl";   // ﬂ
        else if(this.charCodeAt(i) == 64257)    result+="fi";   // ﬁ
        else if(this.charCodeAt(i) == 64256)    result+="ff";   // ﬀ
        else if(this.charCodeAt(i) == 307)      result+="ij";   // ĳ 
        else if(this.charCodeAt(i) == 230)      result+="ae";   // æ
        else if(this.charCodeAt(i) == 198)      result+="AE";   // Æ
        else if(this.charCodeAt(i) == 339)      result+="oe";   // œ
        else if(this.charCodeAt(i) == 338)      result+="OE";   // Œ
        else if(this.charCodeAt(i) == 7531)     result+="ue";   // ᵫ
        else if(this.charCodeAt(i) == 64262)    result+="st";   // ﬆ
        else result+=this.charAt(i);
    }
    return result;
};

Array.prototype.append = Array.prototype.concat;
Array.prototype.last = function(){
    return this[this.length-1];
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              THINGS A CONTEXT *SHOULD* HAVE HAD ANYWAY
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// hasAlpha : void -> Boolean
// if any pixel's alpha is less than 255, there IS an alpha channel used
CanvasRenderingContext2D.prototype.hasAlpha = function(){
    var imgd = this.getImageData(0,0,this.canvas.width, this.canvas.height);
    var pixels = imgd.data;
    for (var i = 0; i<pixels.length; i+=4) {
        if(pixels[i+3]<255) return true;  
    }
    return false;
};


// isColor : void -> Boolean
// if every pixel's R==G==B, it's NOT a color image
CanvasRenderingContext2D.prototype.isColor = function(){
    var imgd = this.getImageData(0,0,this.canvas.width, this.canvas.height);
    var pixels = imgd.data;
    for (var i = 0; i<pixels.length; i += 4) {
        if(!(pixels[i]==pixels[i+1] && pixels[i+1]==pixels[i+2])) return true;
    }
    return false;
};

// isMonochrome : void -> Boolean
// if every pixel is anything besides 0 or 1, it's NOT a monochrome image
CanvasRenderingContext2D.prototype.isMonochrome = function(){
    var imgd = this.getImageData(0,0,this.canvas.width, this.canvas.height);
    var pixels = imgd.data;
    for (var i = 0; i<pixels.length; i++) {
        if(!(pixels[i]==0 || pixels[i]==255)) return false;
    }
    return true;
};


// use the DOM and CSS to get accurate and complete font metrics
// based off of the amazing work at http://mudcu.be/journal/2011/01/html5-typographic-metrics/#baselineCanvas
CanvasRenderingContext2D.prototype._measureText = CanvasRenderingContext2D.prototype.measureText;
CanvasRenderingContext2D.prototype.measureText = function(str){
    var metrics = this._measureText(str);
	// setting up html used for measuring text-metrics
	var container = document.createElement("div"); 
    container.style.cssText = "position: absolute; top: 0px; left: 0px;  zIndex=-1";
	var parent = document.createElement("span");
    parent.style.font = this.font;                // use the same font settings as the context
	var image = document.createElement("img");    // hack to get at CSS baselines properties
	image.width = 42; image.height = 1;           // we use a dataURL to reduce dependency on external image files
	image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWM4MbPgPwAGzwLR05RbqwAAAABJRU5ErkJggg==";
	parent.appendChild(document.createTextNode(str));
	parent.appendChild(image);
	container.appendChild(parent);
    document.body.appendChild(container);
    
	// getting css equivalent of ctx.measureText() <-- overrides default width
	image.style.display = "none";
	parent.style.display = "inline";
    metrics.width = parent.offsetWidth;
    metrics.height = parent.offsetHeight;
    
	// making sure super-wide text stays in-bounds
	image.style.display = "inline";
	var forceWidth = metrics.width + image.offsetWidth;
    
	// capturing the "top" and "bottom" baseline
	parent.style.cssText += "margin: 50px 0; display: block; width: " + forceWidth + "px";
    metrics.topBaseline = image.offsetTop - 49;
    metrics.bottomBaseline = metrics.topBaseline - parent.offsetHeight;
    
	// capturing the "middle" baseline
	parent.style.cssText += "line-height: 0; display: inline; width: " + forceWidth + "px";
    metrics.middleBaseline = image.offsetTop + 1;
    
    // derive other measurement from what we've got
    metrics.alphaBaseline = 0;
    metrics.descender = metrics.alphaBaseline - metrics.bottomBaseline;
    metrics.topPadding = metrics.height - metrics.topBaseline;
    
    document.body.removeChild(container);       // clean up after ourselves
    metrics.str = str;                          // debugging: let's keep the original string
    metrics.font = this.font.cssString          //  and font string around
    return metrics;
};

// Transformation pipeline - initial values
CanvasRenderingContext2D.prototype.m            = new Transform(1,0,0,1,0,0);
CanvasRenderingContext2D.prototype.scaleValues  = [1.0, 1.0];
CanvasRenderingContext2D.prototype.rotation     = 0;
CanvasRenderingContext2D.prototype.origin       = [0, 0];

// Store original methods that we'll need to override
CanvasRenderingContext2D.prototype._rotate = CanvasRenderingContext2D.prototype.rotate;
CanvasRenderingContext2D.prototype._scale = CanvasRenderingContext2D.prototype.scale;
CanvasRenderingContext2D.prototype._transform = CanvasRenderingContext2D.prototype.transform;

// udpatePipeline : void -> void
// apply the stored transform matrix, translation and rotation values to the native transform matrix
CanvasRenderingContext2D.prototype.updatePipeline = function(){ 
    // set the tranformation matrix
    this.setTransform(this.m.m[0],this.m.m[1],this.m.m[2],this.m.m[3],this.m.m[4],this.m.m[5]);
    this.translate(this.origin[0], this.origin[1]);         // then translate
    this._scale(this.scaleValues[0], this.scaleValues[1]);   // then scale
    this._rotate(this.rotation);                             // and finally rotate
}


// transform : Real Real Real Real Real -> void
// Adds a transformation by m to the drawing context’s current transformation.
CanvasRenderingContext2D.prototype.transform = function(m){ 
    this.m.multiply(m); 
    this.updatePipeline();
}


// rotate : Angle -> void
// Adds a rotation of angle radians to the drawing context’s current transformation.
// DOES NOT change the separate rotation
CanvasRenderingContext2D.prototype.rotate = function(radians){ 
    this.m.rotate(radians); 
    this.updatePipeline();
};

// scale : xScale yScale -> void
// Adds a scaling of x-scale in the X-direction and y-scale in the Y-direction to the drawing context’s current transformation.
// DOES NOT change the separate scale values
CanvasRenderingContext2D.prototype.scale = function(xScale, yScale){ 
    this.m.scale(xScale, yScale);
    this.updatePipeline();
};

// getTransformation : -> (Vector (Vector Real Real Real Real Real Real) Real Real Real Real Real)
CanvasRenderingContext2D.prototype.getTransformation = function(){ 
    var scale   = this.getScale();
    var origin  = this.getOrigin();
    var rotation= this.getRotation();
    return [this.m, origin[0], origin[1], scale[0], scale[1], rotation];
};

// setTransformation : T Real Real Real Real Real)-> void
// changes all transformation values
CanvasRenderingContext2D.prototype.setTransformation = function(m, xOrigin, yOrigin, xScale, yScale, rotation){ 
    this.m = new Transform(m[0],m[1],m[2],m[3],m[4],m[5]);
    this.origin = [xOrigin, yOrigin];
    this.scaleValues = [xScale, yScale];
    this.rotation = rotation;
    this.updatePipeline();    
};

// getRotation : void -> Real
CanvasRenderingContext2D.prototype.getRotation = function(){ 
    return this.rotation;
};

// setRotation : Angle -> void
// changes the rotation, but NOT the transformation matrix
CanvasRenderingContext2D.prototype.setRotation = function(radians){ 
    this.rotation = -radians;
    this.updatePipeline();
};

// getScale : void -> Real Real
CanvasRenderingContext2D.prototype.getScale = function(){ 
    return this.scaleValues;
};

// setScale : xScale yScale -> void
// changes the scale values, but NOT the transformation matrix
CanvasRenderingContext2D.prototype.setScale = function(xScale, yScale){ 
    this.scaleValues = [xScale, yScale];
    this.updatePipeline();
};

// getInitialMatrix : void -> (Vector xx xy yx yy xO yO)
CanvasRenderingContext2D.prototype.getInitialMatrix = function(){ 
    return this.m;
};

// setInitialMatrix : (Vector real real real real real real) -> void
CanvasRenderingContext2D.prototype.setInitialMatrix = function(m){ 
    this.m = new Transform(m[0],m[1],m[2],m[3],m[4],m[5]);
    this.updatePipeline();
};