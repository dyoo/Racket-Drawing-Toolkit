
// load all the built-in stipples
StippleDB = [];
var stipples = new Array('bdiagonal-hatch','crossdiag-hatch','fdiagonal-hatch'
                         ,'cross-hatch','horizontal-hatch','vertical-hatch');
for(var i=0; i<stipples.length; i++){
    var b = new Bitmap(16,16,false,true);
    b.loadFile('stipples/'+stipples[i]+'.gif');
    StippleDB[stipples[i]] = b;
}

// makeStipple : Bitmap% Color% -> 2dContext
// buffer the stipple image to an offscreen canvas, and return the canvas
var makeStipple = function(stipple, color){
    var stippleCtx = stipple.buffer();        
    var stippleData = stippleCtx.getImageData(0,0,stipple.width, stipple.height);
    var stipple_pixels = stippleData.data;
    
    // replace black stipple pixels with the rgb values of the color
    // set all white pixels to maximum alpha
    for(var i=0; i<stipple_pixels.length; i += 4){
        var isBlackPixel = ((stipple_pixels[i]+stipple_pixels[i+1]+stipple_pixels[i+2]) == 0);
        if(!isBlackPixel){
            stipple_pixels[i+3]  = 1;
        } else {
            stipple_pixels[i]    = color.red();
            stipple_pixels[i+1]  = color.green();
            stipple_pixels[i+2]  = color.blue();
        }
    }
    stippleData.data = stipple_pixels;
    stippleCtx.putImageData(stippleData,0,0);
    return stippleCtx.canvas;
}



// Font : Number String String [String Number Boolean Boolean Number] -> Font
// imlements Font%, as defined by http://docs.racket-lang.org/draw/font_.html?q=font&q=dc
function Font(size, family, face, style, weight, underline, smoothing, pixels){
    this.size       = size;
    this.family     = (family==undefined)? "normal" : family;
    this.face       = (face==undefined)? false : face;
    this.style      = (style==undefined)? "normal" : style;
    this.weight     = (weight==undefined)? "normal" : weight;
    this.underline  = (underline==undefined)? false : underline;
    this.smoothing  = (smoothing==undefined)? "default" : smoothing;
    this.pixels     = (pixels==undefined)? false : pixels;
    var families = new Array("default","decorative","roman","script","swiss","modern","symbol","system");
    var styles = new Array("normal","slant","italic","oblique");
    var weights = new Array("normal","light","bold");
    var smoothings = new Array("default","partly-smoothed","smoothed","unsmoothed");
    if(families.indexOf(this.family)==-1) throw "Invalid font family: "+family;
    if(styles.indexOf(this.style)==-1) throw "Invalid font style: "+style;
    if(weights.indexOf(this.weight)==-1) throw "Invalid font weight: "+weight;
    if(smoothings.indexOf(this.smoothing)==-1) throw "Invalid font smoothing: "+smoothing;
    
    this.getSize       = function(){return this.size;};
    this.getFamily     = function(){return this.family;};
    this.getFace       = function(){return this.face;};
    this.getStyle      = function(){return this.style;};
    this.getWeight     = function(){return this.weight;};
    this.getUnderline  = function(){return this.underline;};
    this.getSmoothing  = function(){return this.smoothing;};
    this.getPixels     = function(){return this.pixels;};
    
    this.toCSSString = function (){
        var families = new Array(), weights = new Array(), styles = new Array();
        families["default"]     = "Arial";
        families["decorative"]  = "Impact";
        families["roman"]       = "Times New Roman";
        families["script"]      = "cursive";
        families["swiss"]       = "Verdana";
        families["modern"]      = "monospace";
        families["symbol"]      = "Symbol"
        families["system"]      = "";
        weights["normal"]       = 400;
        weights["light"]        = 200;
        weights["bold"]         = 700;
        styles["normal"]        = "";
        styles["italic"]        = "italic";
        styles["slant"]         = "italic";  
        return styles[this.style]+" "+weights[this.weight]+" "+this.size+"px "+(this.face? face : families[this.family]);
    }
    
    // draw the char and a known-bad char on separate contexts in the desired font,
    // then compare the pixel data for both
    this.screenGlyphExists     = function(str){
        // get char code for glyph, as well as known-failing code
        var charCode    = str.charCodeAt(0);
        var failCode    = -1;
        // make two canvases, and get their contexts
        var cCheck      = document.createElement('canvas');
        var cFail       = document.createElement('canvas');
        var ctxCheck    = cCheck.getContext('2d');
        var ctxFail     = cFail.getContext('2d');
        // set both contexts to the desired font, and measure the characters
        ctxCheck.font   = this.toCSSString();
        ctxFail.font    = this.toCSSString();
        var metricsCheck= ctxCheck.measureText(String.fromCharCode(charCode));
        var metricsFail = ctxFail.measureText(String.fromCharCode(failCode));
        // draw the characters
        ctxCheck.fillText((String.fromCharCode(charCode)), 0, metricsCheck.height);
        ctxFail.fillText((String.fromCharCode(failCode)), 0, metricsFail.height);
        var checkD = ctxCheck.getImageData(0,0,cCheck.width,cCheck.height);
        var checkP = checkD.data;
        var failD = ctxFail.getImageData(0,0,cCheck.width,cCheck.height);
        var failP = failD.data;
        // if any pixel differs, return true
        for(var i=0; i<failP.length; i++){
            if(failP[i]!==checkP[i]) return true; 
        }
        // otherwise, we know the glyph is the fail character, so return false
        return false;
    };
}

// FontList : void -> FontList
// imlements FontList%, as defined by http://docs.racket-lang.org/draw/font-list_.html?q=font&q=dc
function FontList(){
    this.fonts = new Array();
    
    // findOrCreateFont : color width style [cap join] -> pen
    this.findOrCreateFont = function(size, family, style, weight, underline, smoothing, pixels){
        // if a matching pen exists, return it
        for(var i=0; i<this.fonts.length; i++){
            if(this.fonts[i].size==size && 
               this.fonts[i].family==family && 
               this.fonts[i].face==face && 
               this.fonts[i].weight==weight &&
               (underline==undefined || this.fonts[i].underline==underline) &&
               (smoothing==undefined || this.fonts[i].smoothing==smoothing) &&
               (pixels==undefined || this.fonts[i].pixels==pixels))
                return this.fonts[i];
        }
        // otherwise make a new Font and add it
        var font = new Font(size, family, face, style, weight, underline, smoothing, pixels);
        this.fonts.push(font);
        return font;
        
    }
    
    return this;
}

// Point: Real Real -> Point
// implements Point%, as defined http://docs.racket-lang.org/draw/point_.html?q=dc
function Point(x, y){
    this.x = x;
    this.y = y;
    this.getX = function(){ return this.x};
    this.getY = function(){ return this.y};
    this.setX = function(x){ this.x = x; };
    this.setY = function(y){ this.y = y; };
}

// Pen : color width style cap join stipple -> Pen
// implements Pen%, as defined by http://docs.racket-lang.org/draw/pen_.html
function Pen(color, width, style, cap, join, stipple){
    this.color = (color==undefined)?    "black" : color;   // Name or RGB value
    this.width = (width==undefined)?    0      : width;   // real 0-255
    this.style = (style==undefined)?    "solid" : style;   // transparent, solid, xor, hilite, dot, long-dash, short-dash, dot-dash...
    this.cap   = (cap==undefined)?      "round" : cap;     // round, projecting, butt
    this.join  = (join==undefined)?     "round" : join;    // round, bevel, miter
    
    this.styles = new Array('transparent', 'solid', 'xor', 'hilite','dot','long-dash','short-dash','dot-dash','xor-dot','xor-long-dash','xor-short-dash','xor-dot-dash');
    
    // if the style is NOT a valid style, throw an error
    if(this.styles.indexOf(this.style) < 0) {
        throw "Not a valid pen style: "+this.style;
    }

    // override any built-stipple with a custom stipple
    if(stipple) this.stipple = makeStipple(stipple, this.color);
    
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

// PenList : void -> PenList
// imlements PenList%, as defined by http://docs.racket-lang.org/draw/pen-list_.html?q=dc
function PenList(){
    this.pens = new Array();
    
    // findOrCreatePen : color width style [cap join] -> pen
    this.findOrCreatePen = function(color, width, style, cap, join){
        // if a matching pen exists, return it
        for(var i=0; i<this.pens.length; i++){
            if(this.pens[i].color==color && 
               this.pens[i].width==width && 
               this.pens[i].style==style &&
               (cap==undefined || this.pens[i].cap==cap) &&
               (join==undefined || this.pens[i].join==join))
                return this.pens[i];
        }
        // otherwise make a new pen and add it
        var pen = new Pen(color, width, style, cap, join);
        this.pens.push(pen);
        return pen;
        
    }
    
    return this;
}

// Brush : color stipple gradient style transformation -> Brush
// implements Brush%, as defined by http://docs.racket-lang.org/draw/brush_.html
function Brush(color, stipple, gradient, style, t){
    this.color = (color==undefined)?        "black" : color;    // Name or RGB value
    this.gradient = (gradient==undefined)?  false : gradient;   // false, a linear gradient or a radial gradient
    this.style = (style==undefined)?        "solid" : style;    // solid, or a built-in stipple
    this.transformation = (t==undefined)?   false : t;          // false, or a transformation
    
    this.styles = new Array('transparent', 'solid','opaque','xor','hilite','panel');
    this.stipples = new Array('bdiagonal-hatch','crossdiag-hatch','fdiagonal-hatch'
                              ,'cross-hatch','horizontal-hatch','vertical-hatch');
    
    // if the style corresponds to a built-in stipple, install the stipple and set style to "solid"
    // if the style is NOT a valid style, throw an error
    if(StippleDB[this.style] !== undefined){
        this.stipple = makeStipple(StippleDB[this.style], this.color);
        this.style = "solid";
    } else if(this.styles.indexOf(this.style) < 0) {
        throw "Not a valid brush style: "+this.style;
    }
    // override any built-stipple with a custom stipple
    if(stipple) this.stipple = makeStipple(stipple, this.color);
    
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

// BrushList : void -> BrushList
// imlements BrushList%, as defined by http://docs.racket-lang.org/draw/brush-list_.html?q=dc
function BrushList(){
    this.brushes = new Array();
    
    // findOrCreateBrush : color style -> brush / #f
    // returns a brush, or false if not a valid colorname
    this.findOrCreateBrush = function(color, style){
        // if a matching brush exists, return it
        for(var i=0; i<this.brushes.length; i++){
            if(this.brushes[i].color==color && this.brushes[i].style==style)
                return this.brushes[i];
        }
        // otherwise make a new brush and add it, if it's a valid color
        var brush = new Brush(color, false, false, style);
        this.brushes.push(brush);
        return brush;
    }
    
    return this;
}


// LinearGradient : Real Real Real Real (Listof [0-1, color]) -> CanvasGradient
// implements LinearGradient%, as defined by http://docs.racket-lang.org/draw/linear-gradient_.html
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
// implements RadialGradient% as defined by http://docs.racket-lang.org/draw/radial-gradient_.html
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