// implement the dc% interface for the HTML5 CANVAS element
// see http://docs.racket-lang.org/draw/dc___.html
// will work in FF 3.5.1+, Safari 3.2+, Chrome 7+ and IE8 w/ExplorerCanvas

// NOT IMPLEMENTED:
//      - end-doc
//      - end-page
//      - start-doc
//      - start-page
//      - erase
//      - try-color
//      - smoothing
//      - clipping
//      - draw-arc
// TODO:
//      - clean up transformation accessors 


// We require the Transform library: https://github.com/simonsarris/Canvas-tutorials/blob/master/
if(Transform == undefined) throw "This library requires transform.js. See source code comments for URL";

// load all the built-in stipples
StippleDB = [];
var stipples = new Array('bdiagonal-hatch','crossdiag-hatch','fdiagonal-hatch'
          ,'cross-hatch','horizontal-hatch','vertical-hatch');
for(var i=0; i<stipples.length; i++){
    var img = new Image();
    img.src = 'stipples/'+stipples[i]+'.gif';
    StippleDB[stipples[i]] = img;
}

// give a color, extract it's RGB colorvalues as a comma-separated string
// from http://stackoverflow.com/questions/3321995/color-code-from-color-name
function RGBvalues(color){
    var t = document.createElement('div');
    t.style.display = 'none';
    t.style.color = color;
    document.body.appendChild(t);
    var style = window.getComputedStyle(t, null);
    var colorValue = style.getPropertyCSSValue('color').getRGBColorValue();
    document.body.removeChild(t);
    return {red: colorValue.red.cssText
        , green: colorValue.green.cssText
        , blue: colorValue.blue.cssText};
}

// buffer the image to an offscreen canvas, set dimensions, and return context
function buffer(img){
    var buffer = document.createElement('canvas');
    buffer.width = img.width;
    buffer.height = img.height;
    var ctx = buffer.getContext('2d');
    ctx.drawImage(img,0,0);
    return ctx;
}


// Pen : color width style cap join stipple -> Pen
// as defined by http://docs.racket-lang.org/draw/pen_.html
function Pen(color, width, style, cap, join, stipple){
    this.color = (color==undefined)?    "black" : color;   // Name or RGB value
    this.width = (width==undefined)?    0      : width;   // real 0-255
    this.style = (style==undefined)?    "solid" : style;   // transparent, solid, xor, hilite, dot, long-dash, short-dash, dot-dash...
    this.cap   = (cap==undefined)?      "round" : cap;     // round, projecting, butt
    this.join  = (join==undefined)?     "round" : join;    // round, bevel, miter
    this.stipple =(stipple==undefined)? false : stipple;   // bitmap or #f
    
    this.getCap = function(){ return this.cap;};
    this.getColor = function(){ return this.color;};
    this.getStyle = function(){ return this.style;};
    this.getWidth = function(){ return this.width;};
    this.getJoin = function(){ return this.join;};
    this.getStipple = function(){ return this.stipple;};
    this.setCap = function(cap){ this.cap = cap;};
    this.setColor = function(color){ this.color = color;};
    this.setStyle = function(style){ this.style = style;};
    this.setWidth = function(width){ this.width = width;};
    this.setJoin = function(join){ this.join = join;};
    this.setStipple = function(stipple){ this.stipple = stipple;};
    
    return this;
}

// Brush : color stipple gradient style transformation -> Brush
// as defined by http://docs.racket-lang.org/draw/brush_.html
function Brush(color, stipple, gradient, style, t){
    this.color = (color==undefined)?        "black" : color;    // Name or RGB value
    this.gradient = (gradient==undefined)?  false : gradient;   // false, a linear gradient or a radial gradient
    this.style = (style==undefined)?        "solid" : style;    // solid, or a built-in stipple
    this.transformation = (t==undefined)?   false : t;          // false, or a transformation

    var makeStipple = function(img){
        // buffer the stipple image to an offscreen canvas
        var stippleCtx = buffer(img);        
        var stippleData = stippleCtx.getImageData(0,0,img.width, img.height);
        var stipple_pixels = stippleData.data;
        var rgb = RGBvalues(color);
        
        // replace stipple pixel's rgb values should be the rgb values of the color
        for(var i=0; i<stipple_pixels.length; i += 4){
            var isBlackPixel = ((stipple_pixels[i]+stipple_pixels[i+1]+stipple_pixels[i+2]) == 0);
            if(!isBlackPixel) continue;             // skip white pixels 
            stipple_pixels[i]    = rgb.red;
            stipple_pixels[i+1]  = rgb.green;
            stipple_pixels[i+2]  = rgb.blue;
        }
        stippleData.data = stipple_pixels;
        stippleCtx.putImageData(stippleData,0,0);
        return stippleCtx.canvas;
    }
    
    this.styles = new Array('transparent', 'solid','opaque','xor','hilite','panel');
    this.stipples = new Array('bdiagonal-hatch','crossdiag-hatch','fdiagonal-hatch'
                              ,'cross-hatch','horizontal-hatch','vertical-hatch');
    
    // if the style corresponds to a built-in stipple, install the stipple and set style to "solid"
    // if the style is NOT a valid style, throw an error
    if(StippleDB[this.style] !== undefined){
        this.stipple = makeStipple(StippleDB[this.style]);
        this.style = "solid";
    } else if(this.styles.indexOf(this.style) < 0) {
        throw "Not a valid brush style";
    }
    // override any built-stipple with a custom stipple
    if(stipple) this.stipple = makeStipple(stipple);    // brush stipple

    this.getColor = function(){return this.color;};
    this.getStyle = function(){return this.style;};
    this.getStipple = function(){return this.stipple;};
    this.getGradient = function(){return this.gradient;};
    this.getTransformation = function(){return this.transformation;};
    this.setColor = function(color){this.color = color;};
    this.setStyle = function(style){this.style = style;};
    this.setStipple = function(stipple){this.stipple = stipple;};
    this.setGradient = function(gradient){this.gradient = gradient;};
    this.setTransformation = function(t){this.transformation = t;};
    return this;
}


// LinearGradient : Real Real Real Real (Listof [0-1, color]) -> CanvasGradient
// as defined by http://docs.racket-lang.org/draw/linear-gradient_.html
LinearGradient = function(x0, y0, x1, y1, stops){
    this.x0 = x0; this.y0 = y0; 
    this.x1 = x1; this.y1 = y1; 
    this.stops = stops;    
    return this;
}
LinearGradient.prototype.getLine = function(){
    return [this.x0, this.y0, this.x1, this.y1];
};
LinearGradient.prototype.getStops = function(){
    return this.stops;
};

// RadialGradient : Real Real Real Real Real Real (Listof [0-1, color]) -> CanvasGradient
// as defined by http://docs.racket-lang.org/draw/radial-gradient_.html
RadialGradient = function(x0, y0, r0, x1, y1, r1, stops){
    this.x0 = x0; this.y0 = y0; this.r0 = r0;
    this.x1 = x1; this.y1 = y1; this.r1 = r1;
    this.stops = stops;
    return this;
}
RadialGradient.prototype.getCircles = function(){
    return [this.x0, this.y0, this.r0, this.x1, this.y1, this.r1];
};
RadialGradient.prototype.getStops = function(){
    return this.stops;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              PROPERTIES AND FUNCTIONS WE NEED TO ADD
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// default brushLists and penLists
CanvasRenderingContext2D.prototype.penList = new Array(new Pen());
CanvasRenderingContext2D.prototype.brushList = new Array(new Brush());
CanvasRenderingContext2D.prototype.pen = CanvasRenderingContext2D.prototype.penList[0];
CanvasRenderingContext2D.prototype.brush = CanvasRenderingContext2D.prototype.brushList[0]

// properties we'll need for rendering text
CanvasRenderingContext2D.prototype.textForeground = "black";
CanvasRenderingContext2D.prototype.textBackground = "white";
CanvasRenderingContext2D.prototype.textMode       = "transparent";

// other properties needed by the interface
CanvasRenderingContext2D.prototype.GlContext      = false;
CanvasRenderingContext2D.prototype.smoothing      = null;


// transformation values: every Drawing Context has a pipeline applied in the following order:
CanvasRenderingContext2D.prototype.m              = new Transform(1,0,0,1,0,0);
CanvasRenderingContext2D.prototype.origin         = [0, 0];
CanvasRenderingContext2D.prototype.scaleValues    = [1, 1];
CanvasRenderingContext2D.prototype.rotation       = 0;

// hasAlpha : void -> Boolean
// if any pixel's alpha is less than 255, there IS an alpha channel used
CanvasRenderingContext2D.prototype.hasAlpha = function(){
    var imgd = this.getImageData(0,0,this.getWidth(), this.getHeight());
    var pixels = imgd.data;
    for (var i = 0; i<pixels.length; i+=4) {
        if(pixels[i+3]<255) return true;  
    }
    return false;
}


// isColor : void -> Boolean
// if every pixel's R==G==B, it's NOT a color image
CanvasRenderingContext2D.prototype.isColor = function(){
    var imgd = this.getImageData(0,0,this.getWidth(), this.getHeight());
    var pixels = imgd.data;
    for (var i = 0; i<pixels.length; i += 4) {
        if(!(pixels[i]==pixels[i+1] && pixels[i+1]==pixels[i+2])) return true;
    }
    return false;
}

// isMonochrome : void -> Boolean
// if every pixel is anything besides 0 or 1, it's NOT a monochrome image
CanvasRenderingContext2D.prototype.isMonochrome = function(){
    var imgd = this.getImageData(0,0,this.getWidth(), this.getHeight());
    var pixels = imgd.data;
    for (var i = 0; i<pixels.length; i++) {
        if(!(pixels[i]==0 || pixels[i]==255)) return false;
    }
    return true;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              WRAPPER FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// provide custom fill implementation, using our brush
CanvasRenderingContext2D.prototype._fill = CanvasRenderingContext2D.prototype.fill;
CanvasRenderingContext2D.prototype.fill = function(){
    // if a stipple is installed, ignore EVERYTHING and just use it as a pattern
    if(this.brush.stipple){
        this.fillStyle = this.createPattern(this.brush.stipple,'repeat');
    }
    // if it's a gradient Object, build the gradient in the current context and use that as our fillStyle
    else if(this.brush.gradient){
        var g = this.brush.gradient;
        if(g instanceof LinearGradient){
            var gradient = this.createLinearGradient(g.x0, g.y0, g.x1, g.y1);
            for(var i=0; i<g.stops.length; i++) gradient.addColorStop(g.stops[i][0], g.stops[i][1]);            
        } else if(g instanceof LinearGradient){
            var gradient = this.createRadialGradient(g.x0, g.y0, g.r0, g.x1, g.y1, g.r1);
            for(var i=0; i<g.stops.length; i++) gradient.addColorStop(g.stops[i][0], g.stops[i][1]);            
        }
        this.fillStyle = gradient;
    }
    // solid (and deprecated styles) use black pixels from a monochrome stipple, if there's one installed
    else if((new Array('solid', 'xor','panel').indexOf(this.brush.style)) >= 0){
        this.fillStyle = this.brush.color;
    } 
    // opaque is the same as solid, but if there's a monochrome stipple we paint the white pixels
    else if((new Array('solid', 'xor','panel').indexOf(this.brush.style)) >= 0){
        this.fillStyle = this.brush.color;
    } 
    // if it's hilite, use the RGBa value for the same color, but with an opacity of 0.3
    else if(this.brush.style == 'hilite'){
        var rgb = RGBvalues(this.brush.color);
        this.fillStyle = "rgba("+rgb.red+","+rgb.green+","+rgb.blue+",0.3)";
    } 
    
    this._fill();
};

// provide custom stroke implementation, using our pen
CanvasRenderingContext2D.prototype._stroke = CanvasRenderingContext2D.prototype.stroke;
CanvasRenderingContext2D.prototype.stroke = function(){
    // everything maps one-to-one, except dc%'s "projecting" is canvas's "square"
    this.lineCap      = (this.pen.cap == "projecting")? "square" : this.pen.cap;
    this.lineJoin     = this.pen.join;
    this.lineWidth    = this.pen.width;
    this.strokeStyle  = this.pen.color;
    this._stroke()
};

// provide a custom measureText implementation, which uses a DOM hack to expose height:
// make a hidden SPAN with the text, then measure it, add height to measureText, and remove the SPAN
CanvasRenderingContext2D.prototype._measureText = CanvasRenderingContext2D.prototype.measureText;
CanvasRenderingContext2D.prototype.measureText = function(str){
    var hack = document.createElement("span");
    hack.style.font = this.font;
    hack.textContent = str;
    hack.style.visibility = 'hidden';
    document.body.appendChild(hack);        // we have to *actually* add the node to the DOM
    var metrics = this._measureText(str);    // call the superclass
    metrics.height = hack.offsetHeight;
    document.body.removeChild(hack);
    return metrics;
};

// LinearGradient : Real Real Real Real (Listof [0-1, color]) -> CanvasGradient
CanvasRenderingContext2D.prototype.LinearGradient = function(x0, y0, x1, y1, stops){
    var g = this.createLinearGradient(x0,y0,x1,y1);
    for(var i=0; i<stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
};

// RadialGradient : Real Real Real Real Real Real (Listof [0-1, color]) -> CanvasGradient
CanvasRenderingContext2D.prototype.RadialGradient = function(x0, y0, r0, x1, y1, r1, stops){
    var g = this.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for(var i=0; i<stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              GETTERS AND SETTERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// getWidth :  void -> Width
CanvasRenderingContext2D.prototype.getWidth = function(){
    return this.canvas.width
};
// getHeight :  void -> Height
CanvasRenderingContext2D.prototype.getHeight = function(){
    return this.canvas.height
};
// getDeviceScale : void -> Real Real
CanvasRenderingContext2D.prototype.getDeviceScale = function(){ 
    return [1.0, 1.0]; 
};
// setAlpha : alpha -> void
CanvasRenderingContext2D.prototype.setAlpha = function(alpha){ 
    if(alpha<0 || alpha>1) throw "Invalid alpha value"
    return this.globalAlpha = alpha;
};
// getAlpha : void -> alpha 
CanvasRenderingContext2D.prototype.getAlpha = function(){ 
    return this.globalAlpha; 
};
// getBackround : void -> Color
CanvasRenderingContext2D.prototype.getBackground = function(){ 
    return this.background; 
};
// getBrush : void -> Brush
CanvasRenderingContext2D.prototype.getBrush = function(){ 
    return this.brush; 
};
// getPen : void -> Pen
CanvasRenderingContext2D.prototype.getPen = function(){ 
    return this.pen; 
};
// getSmoothing : void -> Smoothing
CanvasRenderingContext2D.prototype.getSmoothing = function(){ 
    return this.smoothing; 
};
// setBackground : Color -> void
CanvasRenderingContext2D.prototype.setBackground = function(color){ 
    this.background = color; 
};
// setBrush : Brush -> void
CanvasRenderingContext2D.prototype.setBrush = function(brush){ 
    this.brush = brush; 
};
// setPen : Pen -> void
CanvasRenderingContext2D.prototype.setPen = function(pen){ 
    this.pen = pen; 
};

// getClippingRegion : void -> Region / False
CanvasRenderingContext2D.prototype.getClippingRegion = function(){ 
    throw "NOT YET IMPLEMENTED: get-clipping-region"; 
};

// getGlContext : void -> GlContext / false
// if someone feels like implementing the sgl interface, this would be the way to go...
// see http://docs.racket-lang.org/sgl/main.html
CanvasRenderingContext2D.prototype.getGlContext = function(){ return false; };

// setSmoothing : Mode -> void
CanvasRenderingContext2D.prototype.setSmoothing = function(mode){ 
    if(!(mode == "unsmoothed" || mode == "smoothed" || mode == "aligned"))
        throw "INVALID MODE PASSED TO setSmoothing: "+mode;
    return this.smoothing = mode;
};

// setClippingRect : x y width height -> void
CanvasRenderingContext2D.prototype.setClippingRect = function(x, y, width, height){
    this.rect(x, y, width, height);
    this.clip();
};

// setClippingRegion : Region/False -> void
CanvasRenderingContext2D.prototype.setClippingRegion = function(region){ 
    throw "NOT YET IMPLEMENTED: set-clipping-region"; 
};

// cacheFontMetricsKey : void -> exact-integer
// TODO: is it possible that we share some behavior with an existing context?
// return 0 to be on the safe side
CanvasRenderingContext2D.prototype.cacheFontMetricsKey = function(){ 
    return 0; 
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              DRAWING PRIMITIVES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// clear : void -> void
// Clears the drawing region (fills it with the current background color, as determined by get-background).
CanvasRenderingContext2D.prototype.clear = function(){ 
    this.save();
    this.fillStyle = this.getBackground();
    this.fillRect(0, 0, this.getWidth(), this.getHeight());
    this.restore();
};

// copy : x y width height x2 y2 -> void
// Copies the rectangle defined by x, y, width, and height to x2, y2
// The result is UNDEFINED if the source and destination rectangles overlap.
CanvasRenderingContext2D.prototype.copy = function(x, y, width, height, x2, y2){ 
    if(   (x2 <= x+width)  && (x2 >= x)  // if there's a horizontal overlap
       && (y2 <= y+height) && (y2 >= y)) // AND vertical overlap, then we need to return UNDEFINED
        throw "UNDEFINED";
        else this.drawImage(this.canvas, x, y, width, height, x2, y2, width, height);
};

// drawArc : x y width height startRadians endRadians -> void
CanvasRenderingContext2D.prototype.drawArc = function(x, y, width, height, startRadians, endRadians){ 
    throw "NOT YET IMPLEMENTED: draw-arc"; 
    
};

// drawBitmapSection : source destX destY srcX srcY srcWidth srcHeight [style color mask] -> void
// TODO: [optional arguments] are currently ignored
CanvasRenderingContext2D.prototype.drawBitmapSection = function(srcImg, destX, destY, srcX, srcY, srcWidth, srcHeight, style, color, maskImg){ 
    // buffer the source to an offscreen canvas, and retrieve the context of that buffer
    var src = buffer(srcImg);
    var srcData = src.getImageData(0,0,src.getWidth(), src.getHeight());
    var source_pixels = srcData.data;
    
    if(src.isMonochrome()){
        if(style == 'transparent') return;
        else{
            // replace source pixel's rgb values should be the rgb values of the color
            var rgb = RGBvalues(color);
            for(var i=0; i<source_pixels.length; i += 4){
                var isBlackPixel = ((source_pixels[i]+source_pixels[i+1]+source_pixels[i+2]) == 0);
                // Skip black pixels if style is opaque. Otherwise skip white pixels. 
                if((style=='opaque' && isBlackPixel) || (style!=='opaque' && !isBlackPixel)) continue;
                source_pixels[i]    = rgb.red;
                source_pixels[i+1]  = rgb.green;
                source_pixels[i+2]  = rgb.blue;
            }
        }
    }

    // if a mask is defined, we need to edit the source pixels' alpha values
    if(maskImg!==undefined){
        if(maskImg.width !== srcImg.width || maskImg.height !== srcImg.height)  
            throw "A mask must be the same size as the source image";
        var mask = buffer(maskImg);
        var mask_pixels = mask.getImageData(0,0,mask.getWidth(), mask.getHeight()).data;
        if(mask.isMonochrome()){
            // each source pixel's alpha should be the inverse of the corresponding mask pixel's value
            // in other words, the source shows through everywhere the mask is black
            for(var i=0; i<mask_pixels.length; i += 4) source_pixels[i+3] = 255-mask_pixels[i];
        } else if(mask.hasAlpha()){
            // each source pixel's alpha should be the corresponding mask pixel's alpha
            for(var i=0; i<mask_pixels.length; i += 4) source_pixels[i+3] = mask_pixels[i+3];
        } else if(mask.isColor() && !mask.hasAlpha()){
            // make source pixel's alpha the inverse of the mask's avg RGB value
            for(var i=0; i<mask_pixels.length; i += 4) 
                source_pixels[i+3] = 255-((mask_pixels[i]+mask_pixels[i+1]+mask_pixels[i+2])/3);
        }
        // replace the source data with the new pixels, now properly masked
    }
    srcData.data = source_pixels;
    this.putImageData(srcData, destX, destY, srcX, srcY, srcWidth, srcHeight);
};

// drawBitmap : source destX destY [style color mask] -> void
// just draw a section that happens to be the width and height of the entire sourse
CanvasRenderingContext2D.prototype.drawBitmap = function(src, destX, destY, style, color, mask){ 
    this.drawBitmapSection(src, destX, destY, 
                           0, 0, 
                           src.width,
                           src.height,
                           style, color, mask);
};

// drawEllipse : x y width height -> void
// from: http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas/2173084#2173084
// Draws an ellipse contained in a rectangle with the given top-left corner and size. 
// The current pen is used for the outline, and the current brush is used for filling the shape.
CanvasRenderingContext2D.prototype.drawEllipse = function(x, y, width, height){ 
    var kappa = .5522848;
    var ox = (width / 2) * kappa,  // control point offset horizontal
    oy = (height / 2) * kappa, // control point offset vertical
    xe = x + width,            // x-end
    ye = y + height,           // y-end
    xm = x + width / 2,        // x-middle
    ym = y + height / 2;       // y-middle
    
    this.beginPath();
    this.moveTo(x, ym);
    this.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    this.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    this.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    this.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    this.closePath();
    this.fill();
    this.stroke();
};

// drawLine : x1 y1 x2 y2 -> void
CanvasRenderingContext2D.prototype.drawLine = function(x1, y1, x2, y2){ 
    this.beginPath();
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.stroke();
};

// drawLines : points [xOffset yOffset] -> void
CanvasRenderingContext2D.prototype.drawLines = function(points, xOffset, yOffset){
    var xOffset = (xOffset == undefined)? 0: xOffset;
    var yOffset = (yOffset == undefined)? 0: yOffset;
    this.beginPath();
    this.moveTo(points[0].x+xOffset, points[0].y+yOffset);
    for(var i=1; i<points.length; i++){
        this.lineTo(points[i].x+xOffset, points[i].y+yOffset);
    }
    this.stroke();
};

// drawPath : points [xOffset yOffset fillStyle] -> void
// TODO: properly implement the details of smoothing and fillStyle
CanvasRenderingContext2D.prototype.drawPath = function(points, xOffset, yOffset, fillStyle){ 
    var xOffset = (xOffset == undefined)? 0: xOffset;
    var yOffset = (yOffset == undefined)? 0: yOffset;
    this.beginPath();
    this.moveTo(points[0].x+xOffset, points[0].y+yOffset);
    for(var i=1; i<points.length; i++){
        this.lineTo(points[i].x+xOffset, points[i].y+yOffset);
    }
    this.fill();
};

// drawPoint : x y -> void
// draw an infinitely short line
CanvasRenderingContext2D.prototype.drawPoint = function(x, y){ 
    this.beginPath();
    this.moveTo(x, y);
    this.lineTo(x+.0001, y+.0001);
    this.stroke();
};

// drawPolygon : points [xOffset yOffset fillStyle] -> void
// TODO: fillStyle is currently ignored, properly implement the details of smoothing and fillStyle
CanvasRenderingContext2D.prototype.drawPolygon = function(points, xOffset, yOffset, fillStyle){ 
    xOffset = (xOffset !== undefined)? xOffset : 0;
    yOffset = (yOffset !== undefined)? yOffset : 0;
    this.beginPath();
    this.moveTo(points[0].x+xOffset, points[0].y+yOffset);
    for(var i=1; i<points.length; i++){
        this.lineTo(points[i].x+xOffset, points[i].y+yOffset);
    }
    // close the polygon
    this.lineTo(points[0].x+xOffset, points[0].y+yOffset);
    this.fill();
    this.stroke();
};

// drawRectangle : x y width height -> void
CanvasRenderingContext2D.prototype.drawRectangle = function(x, y, width, height){
    this.drawRoundedRectangle(x, y, width, height, 0);
};

// drawRoundedRectangle : x y width height [radius] -> void
// radius must be between -0.5 and half the shortest side
// TODO: properly implement the details of smoothing
// from http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
CanvasRenderingContext2D.prototype.drawRoundedRectangle = function(x, y, width, height, radius){ 
    // check to make sure the radius is valid
    var shortestSide = Math.min(width, height);
    if(isNaN(radius) || (radius > .5*shortestSide) || (radius < -0.5)) throw "Exn:fail:contract";
    
    // if radius is negative, use the absolute value as a proportion of the shortest side
    if(radius<0) radius = shortestSide*Math.abs(radius);
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    this.fill();
    this.stroke();
};

// drawSpline : x1 y1 x2 y2 x3 y3 -> void
// Cairo uses Cubic Bezier curves for their splines, which are just quadratic curves
CanvasRenderingContext2D.prototype.drawSpline = function(x1, y1, x2, y2, x3, y3){ 
    this.beginPath();
    this.moveTo(x1, y1);
    this.quadraticCurveTo(x2, y2, x3, y3)
    this.stroke();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              TEXT PRIMITIVES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// drawText : text x y [combine offset angle] -> void
// if textMode is 'solid', fill a rectangle with text-background color
// draw fillText using text-foreground color
// TODO: implement angle and combine
CanvasRenderingContext2D.prototype.drawText = function(str, x, y, combine, offset, angle){ 
    this.save();
    if(offset == undefined) offset = 0;
    if(parseInt(offset)!==offset || offset<0) throw "Offset must be an exact, non-negative integer"
    var str = str.slice(offset);
    var metrics = this.measureText(str);
    this.fillStyle = this.getTextBackground();
    if(this.textMode == 'solid') this.fillRect(x, y, metrics.width, metrics.height);
    // use the text foreground color, and have text start at the UPPER left, rather than LOWER left point
    this.fillStyle = this.getTextForeground();
    this.fillText(str, x, y+metrics.height);
    this.restore();
};

// getCharHeight : void -> Real
CanvasRenderingContext2D.prototype.getCharHeight = function(){ 
    var charSize = this.measureText("M");
    return charSize.height;
};

// getCharWidth : void -> Real
CanvasRenderingContext2D.prototype.getCharWidth = function(){ 
    var charSize = this.measureText("M");
    return charSize.width;
};

// getTextBackground : void -> Color / false
CanvasRenderingContext2D.prototype.getTextBackground = function(){ 
    return this.textBackground;
};

// getTextForeground : void -> Color
CanvasRenderingContext2D.prototype.getTextForeground = function(){ 
    return this.textForeground;
};

// getTextExtent : string [font combine offset] -> real real real real
// TODO: properly handle distance from baseline to descender, and extra vertical space
CanvasRenderingContext2D.prototype.getTextExtent = function(str, font, combine, offset){ 
    this.save();
    if(font) this.font = font;
    var metrics = this.measureText(str.slice(offset));
    this.restore();
    return [metrics.width, metrics.height, 0, 0];    
};

// getTextMode : void -> Mode
CanvasRenderingContext2D.prototype.getTextMode = function(){ 
    return this.textMode;
};

// getFont : void -> Font
CanvasRenderingContext2D.prototype.getFont = function(){ 
    return this.font; 
};

// glyphExists : Char -> Boolean
CanvasRenderingContext2D.prototype.glyphExists = function(){ 
    throw "NOT YET IMPLEMENTED: glyph-exists?"; 
};

// setFont : Font -> void
CanvasRenderingContext2D.prototype.setFont = function(font){ 
    this.font = font;
};


// setTextBackground : Color -> void
CanvasRenderingContext2D.prototype.setTextBackground = function(color){ 
    this.textBackground = color;
};

// setTextForeground : Color -> void
CanvasRenderingContext2D.prototype.setTextForeground = function(color){ 
    this.textForeground = color;
};

// setTextMode : Mode -> void
CanvasRenderingContext2D.prototype.setTextMode = function(mode){ 
    if(!(mode == "solid" || mode == "transparent"))
        throw "INVALID MODE PASSED TO setTextMode: "+mode;
    this.textMode = mode;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              TRANSFORMATION PRIMITIVES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// most of this is from https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js

// udpatePipeline : void -> void
// apply the stored transform matrix, translation and rotation values to the native transform matrix
CanvasRenderingContext2D.prototype.updatePipeline = function(){ 
    // set the tranformation matrix
    this.setTransform(this.m.m[0],this.m.m[1],this.m.m[2],this.m.m[3],this.m.m[4],this.m.m[5]);
    this.translate(this.origin[0], this.origin[1]);         // then translate
    this._scale(this.scaleValues[0], this.scaleValues[1]);  // then scale
    this._rotate(this.rotation);                           // and finally rotate
}


// transform : Real Real Real Real Real -> void
// Adds a transformation by m to the drawing context’s current transformation.
CanvasRenderingContext2D.prototype._transform = CanvasRenderingContext2D.prototype.transform;
CanvasRenderingContext2D.prototype.transform = function(m){ 
    this.m.multiply(m); 
    this.updatePipeline();
}


// rotate : Angle -> void
// Adds a rotation of angle radians to the drawing context’s current transformation.
// DOES NOT change the separate rotation
CanvasRenderingContext2D.prototype._rotate = CanvasRenderingContext2D.prototype.rotate;
CanvasRenderingContext2D.prototype.rotate = function(radians){ 
    this.m.rotate(radians); 
    this.updatePipeline();
};

// scale : xScale yScale -> void
// Adds a scaling of x-scale in the X-direction and y-scale in the Y-direction to the drawing context’s current transformation.
// DOES NOT change the separate scale values
CanvasRenderingContext2D.prototype._scale = CanvasRenderingContext2D.prototype.scale;
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
// Derive the Euler Angle from our transformation matrix: tan(c/d)
// http://stackoverflow.com/questions/4361242/extract-rotation-scale-values-from-2d-transformation-matrix
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
// Derive the Euler Angle from our transformation matrix: sx = sqrt(a^2+b^2), sy = sqrt(c^2+d^2)
// http://stackoverflow.com/questions/4361242/extract-rotation-scale-values-from-2d-transformation-matrix
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

// getOrigin : void -> Real Real
CanvasRenderingContext2D.prototype.getOrigin = function(){ 
    return this.origin;
};

// setOrigin : x y -> void
CanvasRenderingContext2D.prototype.setOrigin = function(x, y){
    this.origin = [x,y];
    this.updatePipeline();
};

// getSize : void -> Real Real
// return the width and height of the context
CanvasRenderingContext2D.prototype.getSize = function(){ 
    return {width: this.getWidth(), height: this.getHeight()};
};

// tryColor : tryColor resultColor -> void
CanvasRenderingContext2D.prototype.tryColor = function(tryColor, resultColor){ 
    throw "NOT YET IMPLEMENTED: try-color"; 
};