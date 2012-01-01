// implements dc%, as defined by  http://docs.racket-lang.org/draw/dc___.html
function dc(width, height){
    this.canvas = document.createElement('canvas');
    if(width===undefined){ width = 500;}
    if(height===undefined){ height = 500;}
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");

    // make a buffer, which we'll draw to and let flushing handle the rest
    this.buffer         = document.createElement('canvas').getContext('2d');
    this.buffer.canvas.width  = width;
    this.buffer.canvas.height = height;

    // default values, fontLists, brushLists and penLists
    this.GlContext      = false;
    this.smoothing      = null;
    this.textForeground = "black";
    this.textBackground = "white";
    this.textMode       = "transparent";    
    this.penList        = new PenList();
    this.brushList      = new BrushList();
    this.fontList       = new FontList();
    this.pen            = this.penList.findOrCreatePen(new Color(0,0,0), 1);
    this.brush          = this.brushList.findOrCreateBrush(new Color(0,0,0),"transparent");
    this.font           = new Font(18, "default", false, "normal", "normal");
    this.buffer.font       = this.font.cssString;
    this.buffer.background = "white";
        
    
    // private members  
    var that = this,
        clippingRegion = false,
        flushLock      = false;

    // getClippingRegion : void -> Region / False
    this.getClippingRegion = function(){ 
        return that.clippingRegion; 
    };
    
    // setClippingRegion : Region/False -> void
    // if it's a region, use source-in compositing. Otherwise, use source-over
    this.setClippingRegion = function(rgn){ 
        that.clippingRegion = rgn; 
    };
    
    // setClippingRect : x y width height -> void
    this.setClippingRect = function(x, y, width, height){
        var rgn = new Region(that);
        rgn.setRectangle(x, y, width, height);
        that.setClippingRegion(rgn);
    };    
    

    // flush : void -> void
    // Clip whatever is on the buffer using the region, copy the result to the canvas
    // afterwards, clear the buffer for future drawing
    this.flush = function(){ 
        if(that.flushLock) return;
        if(that.clippingRegion){                                        // if we need to clip....
            that.buffer.globalCompositeOperation = 'destination-in';    // mode = "clipping"
            that.buffer.drawImage(that.clippingRegion.ctx.canvas, 0, 0);// clip the region
        }
        that.ctx.drawImage(that.buffer.canvas, 0, 0);                   // copy the buffer to the ctx
        that.buffer.clearRect(0,0, that.getWidth(), that.getHeight());  // clear the buffer
        that.buffer.globalCompositeOperation = 'source-over';           // mode = "drawing"
    };
    
    // suspend-flush : void -> void
    // if we're doing everything using offscreen buffers, this should stop drawing onscreen
    // until "resume-flush" is called
    this.suspendFlush = function(){ that.flushLock = true; };
    
    // suspend-flush : void -> void
    // if we're doing everything using offscreen buffers, this should erase a suspend-flush operation
    this.resumeFlush = function(){ that.flushLock = false; };
        
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              STROKE AND FILL
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// provide custom fill implementation, using our brush
dc.prototype.fill = function(p){
    this.buffer.beginPath();       // empty the current list of subpaths
    p.makeCanvasPath(this.buffer); // generate native path from %path object
    
    // if a stipple is installed, ignore EVERYTHING ELSE and just use it as a pattern
    if(this.brush.stipple){
        this.buffer.fillStyle = this.buffer.createPattern(this.brush.stipple,'repeat');
    }
    // if it's a gradient Object, build the gradient in the current context and use that as our fillStyle
    else if(this.brush.gradient){
        var g = this.brush.gradient, gradient;
        if(g instanceof LinearGradient){
            gradient = this.buffer.createLinearGradient(g.x0, g.y0, g.x1, g.y1);
        } else if(g instanceof RadialGradient){
            gradient = this.buffer.createRadialGradient(g.x0, g.y0, g.r0, g.x1, g.y1, g.r1);
        }
        for(var i=0; i<g.stops.length; i++){ 
            gradient.addColorStop(g.stops[i][0], g.stops[i][1].getRGBA());
        }
        this.buffer.fillStyle = gradient;
    }
    // solid (and deprecated styles) use black pixels from a monochrome stipple, if there's one installed
    else if((new Array('solid', 'xor','panel').indexOf(this.brush.style)) >= 0){
        this.buffer.fillStyle = this.brush.color.getRGBA();
    } 
    // opaque is the same as solid, but if there's a monochrome stipple we paint the white pixels
    else if((new Array('solid', 'xor','panel').indexOf(this.brush.style)) >= 0){
        this.buffer.fillStyle = this.brush.color.getRGBA();
    } 
    // if it's hilite, use the RGBa value for the same color, but with an opacity of 0.3*255 = 77
    else if(this.brush.style == 'hilite'){
        var c = this.brush.color;
        this.buffer.fillStyle = "rgba("+c.red()+","+c.green()+","+c.blue()+",0.3)";
    } 
    this.buffer.fill();
    this.flush();
};

// provide custom stroke implementation, using our pen
// dc mapping is almost perfect, except that projecting->square cap
dc.prototype.stroke = function(p){
    this.buffer.beginPath();       // empty the current list of subpaths
    p.makeCanvasPath(this.buffer); // generate native path from %path object

    this.buffer.strokeStyle  = this.pen.color;         
    this.buffer.lineCap      = (this.pen.cap == "projecting")? "square" : this.pen.cap;
    this.buffer.lineJoin     = this.pen.join;
    this.buffer.lineWidth    = this.pen.width;
    
    // transparent pens don't draw at all
    if(this.pen.style == "transparent") return;
    
    // hilite pens draw with a 30% alpha
    if(this.pen.style == 'hilite'){
        var c = this.pen.color;
        this.buffer.strokeStyle = "rgba("+c.red()+","+c.green()+","+c.blue()+",0.3)";
    } 
    
    else if(this.pen.style == "solid"){
        this.buffer.strokeStyle = this.pen.color.getRGBA();
    }
    
    // if the style requires fanciness, we give up
    else if(this.pen.styles.indexOf(this.pen.style) > -1){
        console.log("WARNING: Dotted/Dashed Strokes are not supported");
    }
    
    // if a stipple is installed, use it as a pattern
    if(this.pen.stipple){
        this.buffer.strokeStyle = this.buffer.createPattern(this.pen.stipple,'repeat');
    }
    
    this.buffer.stroke()
    this.flush();
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              GETTERS AND SETTERS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// getWidth :  void -> Width
dc.prototype.getWidth = function(){
    return this.canvas.width
};
// getHeight :  void -> Height
dc.prototype.getHeight = function(){
    return this.canvas.height
};
// getDeviceScale : void -> Real Real
dc.prototype.getDeviceScale = function(){ 
    return [1.0, 1.0]; 
};
// setAlpha : alpha -> void
dc.prototype.setAlpha = function(alpha){ 
    if(alpha<0 || alpha>1) throw "Invalid alpha value"
    this.buffer.globalAlpha = alpha;
};
// getAlpha : void -> alpha 
dc.prototype.getAlpha = function(){ 
    return this.buffer.globalAlpha; 
};
// getBackround : void -> Color
dc.prototype.getBackground = function(){ 
    return this.buffer.background; 
};
// getBrush : void -> Brush
dc.prototype.getBrush = function(){ 
    return this.brush; 
};
// getPen : void -> Pen
dc.prototype.getPen = function(){ 
    return this.pen; 
};
// getSmoothing : void -> Smoothing
dc.prototype.getSmoothing = function(){ 
    return this.smoothing; 
};
// setBackground : Color -> void
dc.prototype.setBackground = function(color){ 
    this.buffer.background = color; 
};
// setBrush : Brush -> void
dc.prototype.setBrush = function(brush){ 
    this.brush = brush; 
};
// setPen : Pen -> void
dc.prototype.setPen = function(pen){ 
    this.pen = pen; 
};


// getGlContext : void -> GlContext / false
// if someone feels like implementing the sgl interface, this would be the way to go...
// see http://docs.racket-lang.org/sgl/main.html
dc.prototype.getGlContext = function(){ return false; };

// setSmoothing : Mode -> void
dc.prototype.setSmoothing = function(mode){ 
    if(!(mode == "unsmoothed" || mode == "smoothed" || mode == "aligned"))
        throw "INVALID MODE PASSED TO setSmoothing: "+mode;
    this.smoothing = mode;
};

// cacheFontMetricsKey : void -> exact-integer
// TODO: is it possible that we share some behavior with an existing context?
// return 0 to be on the safe side
dc.prototype.cacheFontMetricsKey = function(){ 
    return 0; 
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              DRAWING PRIMITIVES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// clear : void -> void
// Clears the drawing region (fills it with the current background color, as determined by get-background).
dc.prototype.clear = function(){ 
    this.buffer.save();
    this.buffer.fillStyle = this.getBackground();
    this.buffer.fillRect(0, 0, this.getWidth(), this.getHeight());
    this.buffer.restore();
};

// erase : void -> void
// Clears the drawing region (see clear). For transparent canvases, sets globalAlpha to 1.0
dc.prototype.erase = function(){ 
    this.ctx.save();
    this.ctx.fillStyle = this.getBackground();
    this.ctx.fillRect(0, 0, this.getWidth(), this.getHeight());
    this.ctx.restore();
    if(this.globalAlpha > 0) this.ctx.globalAlpha = 1.0;
};

// copy : x y width height x2 y2 -> void
// Copies the rectangle defined by x, y, width, and height to x2, y2
// The result is UNDEFINED if the source and destination rectangles overlap.
dc.prototype.copy = function(x, y, width, height, x2, y2){ 
    if(   (x2 <= x+width)  && (x2 >= x)  // if there's a horizontal overlap
       && (y2 <= y+height) && (y2 >= y)) // AND vertical overlap, then we need to return UNDEFINED
        throw "UNDEFINED";
    else this.buffer.drawImage(this.canvas, x, y, width, height, x2, y2, width, height);
};

// drawBitmapSection : source destX destY srcX srcY srcWidth srcHeight [style color mask] -> void
dc.prototype.drawBitmapSection = function(srcBitmap, destX, destY, srcX, srcY, 
                                          srcWidth, srcHeight, style, color, maskBitmap){ 
    // replace the source's alpha channel with mask's inverse R channel (since R=B=G)
    var monochromeMask = function(sPixels,mPixels){
        for(var i=0; i<mPixels.length; i += 4) sPixels[i+3] = 255-mPixels[i];
    }
    // replace the source's alpha channel with the mask's
    var alphaMask = function(sPixels,mPixels){
        for(var i=0; i<mPixels.length; i += 4) sPixels[i+3] = mPixels[i+3];
    }
    // replace the source's alpha channel with the average value of mask's R, G and B channels
    var colorMask = function(sPixels,mPixels){
        for(var i=0; i<mPixels.length; i += 4) sPixels[i+3] = 255-((mPixels[i]+mPixels[i+1]+mPixels[i+2])/3);
    }
    
    // copy the source to an offscreen buffer, and extract it's pixels
    var src = srcBitmap.buffer();
    var srcData = src.getImageData(0,0,srcBitmap.width, srcBitmap.height);
    var source_pixels = srcData.data;
    
    // Monochrome Images: transparent styles abort, everything else recolors
    if(src.isMonochrome() && color !== undefined){
        if(style == 'transparent') return;
        // replace source pixel's rgb values should be the rgb values of the color
        for(var i=0; i<source_pixels.length; i += 4){
            var isBlackPixel = ((source_pixels[i]+source_pixels[i+1]+source_pixels[i+2]) == 0);
            // Skip black pixels if style is opaque. Otherwise skip white pixels. 
            if((style=='opaque' && isBlackPixel) || (style!=='opaque' && !isBlackPixel)) continue;
            source_pixels[i]    = color.red();
            source_pixels[i+1]  = color.green();
            source_pixels[i+2]  = color.blue();
        }
    }
    
    // MASKING, grab the mask's pixel values and perform the operation
    if(maskBitmap!==undefined){
        if(maskBitmap.width !== srcBitmap.width || maskBitmap.height !== srcBitmap.height)  
            throw "A mask must be the same size as the source image. src="+src.getWidth()+"x"+src.getHeight()+", mask="+mask.getWidth()+"x"+mask.getHeight();
        var maskCtx = maskBitmap.ctx;
        var mask_pixels = maskCtx.getImageData(0,0,maskBitmap.width, maskBitmap.height).data;
        
        if(maskCtx.isMonochrome())     monochromeMask(source_pixels, mask_pixels);
        else if(maskCtx.hasAlpha())    alphaMask(source_pixels, mask_pixels);
        else if(maskCtx.isColor())     colorMask(source_pixels, mask_pixels);
    }
    // reset and replace the source data with the new pixels, now properly masked
    src.canvas.width = srcWidth; src.canvas.height = srcHeight;
    srcData.data = source_pixels;
    src.putImageData(srcData,0,0);
    
    // use drawImage to preserve transparency, since putImageData doesn't
    this.buffer.drawImage(src.canvas,destX,destY);
    this.flush();
};

// drawBitmap : source destX destY [style color mask] -> void
// just draw a section that happens to be the width and height of the entire sourse
dc.prototype.drawBitmap = function(src, destX, destY, style, color, mask){ 
    this.drawBitmapSection(src, destX, destY, 
                           0, 0, 
                           src.width,
                           src.height,
                           style, color, mask);
};

// drawArc : x y width height startRadians endRadians -> void
// draw a CCW arc of an ellipse, inscribed in a WxH rectangle
dc.prototype.drawArc = function(x, y, width, height, startRadians, endRadians){ 
    var p = new dcPath();
    p.arc(x, y, width, height, startRadians, endRadians);
    // if the brush is not transparent, add a line to the center and then fill
    if(this.brush.style !== "transparent"){
        p.lineTo(x+width/2, y+height/2);
        this.fill(p);
    }
    this.stroke(p);
};

// drawEllipse : x y width height -> void
// draw an elliptical arc which happens to go the entire 2pi radians
dc.prototype.drawEllipse = function(x, y, width, height){ 
    var p = new dcPath();
    p.arc(x, y, width, height, 0, 2*Math.PI);
    this.fill(p);
    this.stroke(p);
};

// drawLine : x1 y1 x2 y2 -> void
dc.prototype.drawLine = function(x1, y1, x2, y2){ 
    var p = new dcPath();
    p.moveTo(x1, y1);
    p.lineTo(x2, y2);
    this.stroke(p);
};

// drawLines : points [xOffset yOffset] -> void
dc.prototype.drawLines = function(points, xOffset, yOffset){
    if(xOffset == undefined) xOffset = 0;
    if(yOffset == undefined) yOffset = 0;
    var p = new dcPath();
    p.moveTo(points[0].x+xOffset, points[0].y+yOffset);
    p.lines(points, xOffset, yOffset);
    this.stroke(p);
};

// drawPath : path [xOffset yOffset fillStyle] -> void
// TODO: use fillStyle argument
dc.prototype.drawPath = function(path, xOffset, yOffset, fillStyle){ 
    if(xOffset == undefined) xOffset = 0;
    if(yOffset == undefined) yOffset = 0;
    path.translate(xOffset, yOffset);
    this.fill(path);
};

// drawPoint : x y -> void
// draw an infinitely short line
dc.prototype.drawPoint = function(x, y){ 
    var p = new dcPath();
    p.rectangle(x, y, 1, 1);
    this.stroke(p);
};

// drawPolygon : points [xOffset yOffset fillStyle] -> void
dc.prototype.drawPolygon = function(points, xOffset, yOffset, fillStyle){ 
    if(xOffset == undefined) xOffset = 0;
    if(yOffset == undefined) yOffset = 0;
    var p = new dcPath();
    p.moveTo(points[0].x+xOffset, points[0].x+yOffset);
    p.lines(points, xOffset, yOffset);
    // close the polygon
    p.lineTo(points[0].x+xOffset, points[0].y+yOffset);
    p.close();
    this.fill(p);
    this.stroke(p);
};

// drawRectangle : x y width height -> void
dc.prototype.drawRectangle = function(x, y, width, height){
    var p = new dcPath();
    p.rectangle(x,y,width,height);
    this.fill(p);
    this.stroke(p);
};

// drawRoundedRectangle : x y width height [radius] -> void
dc.prototype.drawRoundedRectangle = function(x, y, width, height, radius){
    var p = new dcPath();
    p.roundedRectangle(x,y,width,height,radius);
    this.fill(p);
    this.stroke(p);
};

// drawSpline : x1 y1 x2 y2 x3 y3 -> void
// draw a quadratic bezier curve from (x1,y1) to (x3,y3), using (x2,y2) as a control point
// see http://chickenmeister.posterous.com/convert-quadratic-to-cubic-bezier-curves
dc.prototype.drawSpline = function(x1, y1, x2, y2, x3, y3){ 
    var p = new dcPath();
    p.moveTo(x1, y1);
    var c1x = .33*x1+.66*x2, c1y = .33*y1+.66*y2;
    var c2x = .66*x2+.33*x3, c2y = .66*y2+.33*y3;
    p.curveTo(c1x, c1y, c2x, c2y, x3, y3);
    this.stroke(p);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                              TEXT PRIMITIVES
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// drawText : text x y [combine offset angle] -> void
// if textMode is 'solid', fill a rectangle with text-background color
// TODO: implement subpixel antialiasing http://www.bel.fi/~alankila/lcd/
dc.prototype.drawText = function(str, x, y, combine, offset, angle){ 
    this.buffer.save();
    if(angle==undefined)        angle = 0;       // angle is zero unless specified otherwise
    if(offset==undefined)       offset = 0;
    if(combine==undefined)      combine = false;
    if(parseInt(offset)!==offset || offset<0) throw "Offset must be an exact, non-negative integer";
    var str = str.slice(offset);
    var str = combine? str : str.removeLigatures(); // if combine is off, remove all ligatures
    
    // assign as the canvas font, and measure the text
    this.buffer.font = this.font.toCSSString();
    var metrics = this.buffer.measureText(str);
    
    // if textMode is solid and there's no rotation, fill a rectangle with the text-background-color
    this.buffer.fillStyle = this.getTextBackground();
    if(this.buffer.textMode == 'solid' && angle==0) this.buffer.fillRect(x, y, metrics.width, metrics.height);
    // if there's an angle, rotate the canvas
    if(angle!==0) this.buffer._rotate(angle);
    
    // fillText uses the bottom-right corner to start, so we need to offset by the height
    this.buffer.fillStyle = this.getTextForeground();
    this.buffer.fillText(str, x, y+metrics.height);
    
    // underline by drawing alone the baseline in the same color
    if(this.font.underline){
        this.buffer.beginPath();
        this.buffer.moveTo(x,y+metrics.topBaseline+metrics.topPadding+2);
        this.buffer.lineTo(x+metrics.width, y+metrics.topBaseline+metrics.topPadding+2);
        this.buffer.closePath();
        this.buffer.strokeStyle = this.getTextForeground();
        this.buffer.lineWidth = 1;
        this.buffer.stroke();
    }
    this.buffer.restore();
    this.flush();
};

// getCharHeight : void -> Real
dc.prototype.getCharHeight = function(){ 
    var charSize = this.buffer.measureText("M");
    return charSize.height;
};

// getCharWidth : void -> Real
dc.prototype.getCharWidth = function(){ 
    var charSize = this.buffer.measureText("M");
    return charSize.width;
};

// getTextBackground : void -> Color / false
dc.prototype.getTextBackground = function(){ 
    return this.textBackground;
};

// getTextForeground : void -> Color
dc.prototype.getTextForeground = function(){ 
    return this.textForeground;
};

// getTextExtent : string [font% combine offset] -> real real real real
// TODO: more rigorous testing, with different fonts
dc.prototype.getTextExtent = function(str, font, combine, offset){ 
    this.buffer.save();
    if(font) this.buffer.font = font.toCSSString();
    var str = combine? str : str.removeLigatures();
    var metrics = this.buffer.measureText(str.slice(offset));
    this.buffer.restore();
    return [metrics.width, metrics.height, metrics.descender, metrics.topPadding];    
};

// getTextMode : void -> Mode
dc.prototype.getTextMode = function(){ 
    return this.textMode;
};

// getFont : void -> Font
dc.prototype.getFont = function(){ 
    return this.font; 
};

// glyphExists : Char -> Boolean
dc.prototype.glyphExists = function(c){ 
    return this.font.screenGlyphExists(c); 
};

// setFont : Font -> void
// set the *real* font property to the cssString of the Font object
dc.prototype.setFont = function(font){ 
    this.font = font;
};

// setTextBackground : Color -> void
dc.prototype.setTextBackground = function(color){ 
    this.textBackground = color;
};

// setTextForeground : Color -> void
dc.prototype.setTextForeground = function(color){ 
    this.textForeground = color;
};

// setTextMode : Mode -> void
dc.prototype.setTextMode = function(mode){ 
    if(!(mode == "solid" || mode == "transparent"))
        throw "INVALID MODE PASSED TO setTextMode: "+mode;
    this.textMode = mode;
};

// tryColor : tryColor resultColor -> void
dc.prototype.tryColor = function(tryColor, resultColor){ 
    return "try-color: NOT IMPLEMENTED";
};

// transform : Real Real Real Real Real -> void
// Adds a transformation by m to the drawing context’s current transformation.
dc.prototype.transform = function(m){ this.buffer.transform(m); };

// rotate : Angle -> void
// Adds a rotation of angle radians to the drawing context’s current transformation.
// DOES NOT change the separate rotation
dc.prototype.rotate = function(radians){ this.buffer.rotate(radians); };

// scale : xScale yScale -> void
// Adds a scaling of x-scale in the X-direction and y-scale in the Y-direction to the drawing context’s current transformation.
// DOES NOT change the separate scale values
dc.prototype.scale = function(xScale, yScale){ this.buffer.scale(xScale, yScale); };

// getTransformation : -> (Vector (Vector Real Real Real Real Real Real) Real Real Real Real Real)
dc.prototype.getTransformation = function(){ return this.buffer.getTransformation(); };

// setTransformation : T Real Real Real Real Real)-> void
// changes all transformation values
dc.prototype.setTransformation = function(m, xOrigin, yOrigin, xScale, yScale, rotation){ 
    this.buffer.setTransformation(m, xOrigin, yOrigin, xScale, yScale, rotation); 
};

// getRotation : void -> Real
dc.prototype.getRotation = function(){ return this.buffer.rotation; };

// setRotation : Angle -> void
// changes the rotation, but NOT the transformation matrix
dc.prototype.setRotation = function(radians){ this.buffer.setRotation(radians); };

// getScale : void -> Real Real
dc.prototype.getScale = function(){ return this.buffer.getScale(); };

// setScale : xScale yScale -> void
// changes the scale values, but NOT the transformation matrix
dc.prototype.setScale = function(xScale, yScale){ this.buffer.setScale(xScale, yScale); };

// getInitialMatrix : void -> (Vector xx xy yx yy xO yO)
dc.prototype.getInitialMatrix = function(){ return this.buffer.getInitialMatrix(); };

// setInitialMatrix : (Vector real real real real real real) -> void
dc.prototype.setInitialMatrix = function(m){  this.buffer.setInitialMatrix(m); };

// getOrigin : void -> Real Real
dc.prototype.getOrigin = function(){ return this.buffer.getOrigin(); };

// setOrigin : x y -> void
dc.prototype.setOrigin = function(x, y){ this.buffer.setOrigin(x,y); };

// getSize : void -> Real Real
// return the width and height of the context
dc.prototype.getSize = function(){  return this.buffer.getSize(); };


// implements bitmap_dc%, as defined by  http://docs.racket-lang.org/draw/bitmap-dc___.html
// inherit directly from dc%, then manually inherit each of the methods of bitmap%
bitmap_dc.prototype = new dc();
bitmap_dc.constructor=bitmap_dc;
function bitmap_dc(url){
    if(url) this.loadFile(url,null,null,true);
}
bitmap_dc.prototype.getARGBpixels = Bitmap.prototype.getARGBpixels;
bitmap_dc.prototype.setARGBpixels = Bitmap.prototype.setARGBpixels;
bitmap_dc.prototype.getDepth = Bitmap.prototype.getDepth;
bitmap_dc.prototype.hasAlphaChannel = Bitmap.prototype.hasAlphaChannel;
bitmap_dc.prototype.isColor = Bitmap.prototype.isColor;
bitmap_dc.prototype.ok = Bitmap.prototype.ok;
bitmap_dc.prototype.loadFile = Bitmap.prototype.loadFile;
bitmap_dc.prototype.saveFile = Bitmap.prototype.saveFile;
bitmap_dc.prototype.getPixel = function(x, y, color){
    data = this.buffer.getImageData(x, y, 1, 1).data;
    color.r = data[0];
    color.g = data[1];
    color.b = data[2];
    color.a = data[3];
};
bitmap_dc.prototype.getBitmap = function(){
    var b = new Bitmap(this.getWidth(), this.getHeight(), this.monochrome, this.alpha);
    b.ctx.drawImage(this.canvas,0,0);
    return b;
};
bitmap_dc.prototype.setBitmap = function(bitmap){
    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;
    this.buffer.drawImage(bitmap.canvas,0,0);
};