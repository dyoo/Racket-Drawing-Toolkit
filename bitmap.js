// Bitmap : Number Number [Boolean Boolean]? -> Bitmap
// implements Bitmap%, as defined by http://docs.racket-lang.org/draw/bitmap_.html?q=dc
function Bitmap(width, height, monochrome, alpha ){
    this.width          = width;
    this.height         = height;
    this.monochrome     = (monochrome==undefined)? false : monochrome;
    this.alpha          = (monochrome==alpha)? false : alpha;
    this.isOk           = false;
    
    // create a canvas of the correct size, with a solid white BG
    this.canvas = document.createElement('canvas');
    this.canvas.width   = this.width;
    this.canvas.height  = this.height;
    this.ctx = this.canvas.getContext('2d');
    
    return this;
}
    
Bitmap.prototype.getWidth       = function(){return this.width;};
Bitmap.prototype.getHeight      = function(){return this.height;};
Bitmap.prototype.getMonochrome  = function(){return this.monochrome;};
Bitmap.prototype.getalpha       = function(){return this.alpha;};


// get-argb-pixels : x y width height pixels [just-alpha? pre-multiplied?] -> void
// getImageData() for the specified region, then reshuffle output to match interface
Bitmap.prototype.getARGBpixels = function(x, y, w, h, pixels, justAlpha, preMultiplied){
    if(justAlpha==undefined)     justAlpha      = false;
    if(preMultiplied==undefined) preMultiplied  = false;
    var img = this.ctx.getImageData(x,y,w,h);
    var rawPixels = img.data;
    for(var i=0; i< rawPixels.length; i+=4){
        pixels.push(rawPixels[i+3]);
        // if justAlpha, stop at the alpha pixel
        if(justAlpha) continue;                       // A
        // otherwise, if there *is* an alpha channel and preMultiplied is true,
        // scale all the RGB values by alpha
        else var factor = (preMultiplied && this.alpha)? this.alpha : 255;
        pixels.push((rawPixels[i]   * factor)/255);   // R
        pixels.push((rawPixels[i+1] * factor)/255);   // G
        pixels.push((rawPixels[i+2] * factor)/255);   // B
    }
};

// set-argb-pixels : x y width height pixels [just-alpha? pre-multiplied?] -> void
// reshuffle pixels to match imageData object
Bitmap.prototype.setARGBpixels = function(x, y, w, h, pixels, justAlpha, preMultiplied){
    if(justAlpha==undefined)     justAlpha      = false;
    if(preMultiplied==undefined) preMultiplied  = false;
    var img = this.ctx.createImageData(w,h);
    var imgPixels = img.data;
    for(var i=0; i< pixels.length; i+=4){
        // make a grayscale image that's the inverse of the alpha
        if(justAlpha && !this.alpha){
            imgPixels[i+3]  = 255;                  // A
            imgPixels[i]    = 255-pixels[i+3];      // R
            imgPixels[i+1]  = 255-pixels[i+3];      // G
            imgPixels[i+2]  = 255-pixels[i+3];      // B
        }
        // if the RGB values have been premultiplied, make sure they're not larger than the alpha
        else if(preMultiplied && !justAlpha && this.alpha){
            imgPixels[i+3]  = 255;                              // A
            imgPixels[i+1]  = Math.min(pixels[i+1],pixels[i]);  // R
            imgPixels[i+2]  = Math.min(pixels[i+2],pixels[i]);  // G
            imgPixels[i+3]  = Math.min(pixels[i+3],pixels[i]);  // B
            // just copy all four pixels, converting RGB->ARGB
        } else {
            imgPixels[i+3]  = pixels[i];            // A
            imgPixels[i]    = pixels[i+1];          // R
            imgPixels[i+1]  = pixels[i+2];          // G
            imgPixels[i+2]  = pixels[i+3];          // B
        }
        img.data = imgPixels;
        this.ctx.putImageData(img, x, y);
    }
};

// get-depth: void -> Number
// gets the depth of the bitmap, which is either 1 or 32
Bitmap.prototype.getDepth = function(){return this.monochrome? 1 : 32; };

// get-loaded-mask: void -> Bitmap
// generate a bitmap from the alpha channel - differs from interface in that it's done on-demand
Bitmap.prototype.getLoadedMask = function(){
    var mask = document.createElement('canvas');
    mask.width = this.width; mask.height = this.height;
    var maskCtx = mask.getContext('2d');
    
    // generate a grayscale canvas whose values are the inverse of the bitmap's alpha
    var alphaPixels = new Array();
    this.getARGBpixels(0, 0, this.width, this.height, alphaPixels, true);
    var maskData = maskCtx.createImageData(this.width, this.height);
    var maskPixels = maskData.data;
    for(var i=0; i<maskPixels.length; i+=4){
        maskPixels[i]   = 255-alphaPixels[Math.floor(i/4)];     // R
        maskPixels[i+1] = 255-alphaPixels[Math.floor(i/4)];     // G
        maskPixels[i+2] = 255-alphaPixels[Math.floor(i/4)];     // B
        maskPixels[i+3] = 255;                                  // A
    }
    maskData.data = maskPixels;
    maskCtx.putImageData(maskData,0,0);
    return mask;
}

// has-alpha-channel : void -> Boolean
// does the bitmap contain an alpha channel?
Bitmap.prototype.hasAlphaChannel = CanvasRenderingContext2D.hasAlpha;

// is-color : void -> Boolean
// is the bitmap monochrome?
Bitmap.prototype.isColor = CanvasRenderingContext2D.isColor;

// ok : void -> Boolean
// Returns #t if the bitmap is valid in the sense that an image file was loaded successfully.
Bitmap.prototype.ok = function(){return this.isOk;};

// load-file : path [kind Color Complain] -> boolean
// try loading an image into the Bitmap. If successful, set ok to true
// TODO: use bgcolor with PNGs
Bitmap.prototype.loadFile = function(url, kind, bgcolor, complain){
    if(complain == undefined) complain = false;
    var that = this;
    try{
        var img = new Image();
        img.src = url;
        img.onload = function(){
            // http://www.sajithmr.me/javascript-check-an-image-is-loaded-or-not
            if(img.naturalWidth == 0) throw "image did not load";
            that.canvas.width = img.width;
            that.canvas.height = img.height;
            that.ctx.drawImage(img,0,0);
            that.isOk = true;
        }
    } catch (e) {
        if(complain) throw e;
        this.isOk = false;
    }
}

// save-file : String [String Number] -> boolean
// TODO: extend the converter to return BMP, XPM and XBM files
Bitmap.prototype.saveFile = function(name, kind, quality){
    var converter       = new Array();
    converter["png"]    = function(canvas){ return canvas.toDataURL("image/png"); };
    converter["jpeg"]   = function(canvas){ return canvas.toDataURL("image/jpeg"); };
    converter["xbm"]    = function(canvas){ throw "save-file: XBM is not supported!"; };
    converter["xpm"]    = function(canvas){ throw "save-file: XPM is not supported!"; };
    converter["bmp"]    = function(canvas){ throw "save-file: BMP is not supported!"; };
    uriContent = converter[kind](this.canvas, quality);
    window.open(uriContent, "BitmapImage."+kind);

}



// buffer : void -> Context
// return a copy of the original context
Bitmap.prototype.buffer = function(){
    var c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(this.canvas,0,0);
    return ctx;
}
