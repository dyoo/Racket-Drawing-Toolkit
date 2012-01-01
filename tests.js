// initialize some Colors for the tests as well
red     = new Color(255,  0,  0);
green   = new Color(  0,255,  0);
blue    = new Color(  0,  0,255);
black   = new Color(  0,  0,  0);
purple  = new Color(255,  0,255);

// initialize some Bitmaps to use in the tests
var i1  = new Bitmap(150,150);
var BWmask = new Bitmap(150,150);
var ColorMask = new Bitmap(150,150);
var AlphaMask = new Bitmap(150,150);

// i1 is the Bootstrap icon, the rest are masks of varying types
i1.loadFile("http://www.litech.org/~schanzer/DrawingToolkit/icon.gif", "gif",black, true);
BWmask.loadFile("http://www.litech.org/~schanzer/DrawingToolkit/BWMask.gif", "gif",black, true);
ColorMask.loadFile("http://www.litech.org/~schanzer/DrawingToolkit/ColorMask.png", "png",red, true);
AlphaMask.loadFile("http://www.litech.org/~schanzer/DrawingToolkit/AlphaMask.png", "png",green, true);


// given a test suite and a drawing context, run all tests
// if a value is expected, check against that value
function runTests(testSuite, dc){
    
    var errors = new Array();
    for(i=0; i<testSuite.length; i++){
        try{
            var result = testSuite[i].test(dc);
            if(testSuite[i].expected == undefined){
                console.log(testSuite[i].api + " : " + testSuite[i].desc+": PASSED"+"\n");  
            } else { 
                if(testSuite[i].expected.toString() !== result.toString())
                    console.log(testSuite[i].api + " : " + testSuite[i].desc+" FAILED:   expected: " + testSuite[i].expected.toString() + " but got " + result.toString()+"\n");
                else console.log(testSuite[i].api + " : " + testSuite[i].desc +" PASSED: expectations matched"+"\n")
                    }
        } catch(e){errors.push(testSuite[i].api + " : " + testSuite[i].desc+" FAILED: "+e+"\n");}
    }
    if(errors.length == 0) alert("All test pass!");
    else {alert("Some tests FAILED. See console for details"); console.log(errors);};
}


///////////////////// VARIOUS TESTS /////////////////////////
var drawing  =  new Array( { api: "erase"
                          ,desc: "erase the canvas"
                          ,test: function(dc){dc.erase();} }
                          ,{ api: "draw-ellipse"
                          ,desc: "narrow, tall, black ellipse should appear at (300,300)"
                          ,test: function(dc){dc.drawEllipse(300, 300, 20, 150);} }
                          ,{ api: "draw-line"
                          ,desc: "line should appear going from bottom-left to upper-right"
                          ,test: function(dc){dc.drawLine(0, 500, 500, 0);} }
                          ,{ api: "draw-lines"
                          ,desc: "zigzag lines should appear somewhere around the Bootstrap logo"
                          ,test: function(dc){// build some points
                          var points = [new Point(20, 40),new Point(50, 100),new Point(60,50),new Point(70,110),new Point(180,120)];
                          dc.drawLines(points, 320, 30);} }
                          ,{ api: "draw-path"
                          ,desc: "draw a path using the same zigzag coordinates as the draw-lines test, but a lower offset"
                          ,test: function(dc){// build some points
                          var points = [new Point(20,40),new Point(50, 40),new Point(60, 90),new Point(100, 100),new Point(120,140)]
                          dc.drawPath(points, 320, 130);} }
                          ,{ api: "draw-point"
                          ,desc: "a single point should appear in the bottom-right corner"
                          ,test: function(dc){dc.drawPoint(480, 480);} }
                          ,{ api: "draw-polygon & setBrush"
                          ,desc: "a red square should be drawn, near the middle of the DC"
                          ,test: function(dc){            // build a square
                          var points = [new Point(200, 200),new Point(300, 200),new Point(300, 300),new Point(200, 300)];
                          dc.setBrush(new Brush(blue));
                          dc.drawPolygon(points, 20, 30);} }
                          ,{ api: "copy"
                          ,desc: "make a copy of the first 200x200 square"
                          ,test: function(dc){dc.copy(0, 0, 200, 200, 201, 0);} }
                          ,{ api: "drawArc"
                          ,desc: "draw the UL 90 degrees of a 50x100 elliptical arc at (10, 300)"
                          ,test: function(dc){dc.drawArc(10, 300, 50, 100, 270*Math.PI/180, 0);} }
                          ,{ api: "draw-rectangle"
                          ,desc: "draw a box around the ellipse we made"
                          ,test: function(dc){dc.drawRectangle(300,300,20,150);} }
                          ,{ api: "set-brush"
                          ,desc: "make a brush with hilite style, so it'll be translucent"
                          ,test: function(dc){dc.setBrush(new Brush(red, false, false, "hilite"));} }
                          ,{ api: "draw-rounded-rectangle1"
                          ,desc: "draw the a box around the first 200x200, but round the corners by 30px"
                          ,test: function(dc){dc.drawRoundedRectangle(0,100,200,200, 30);} }
                          ,{ api: "new LinearGradient"
                          ,desc: "make a brush with linear gradient"
                          ,test: function(dc){dc.setBrush(new Brush(purple, false, new LinearGradient(0,0,500,500, new Array([0,red],[1, green]))));} }
                          ,{ api: "draw-rounded-rectangle2"
                          ,desc: "draw the a box around the first 200x200, but round the corners by 30px"
                          ,test: function(dc){dc.drawRoundedRectangle(300,300,200,200, 30);} }
                          ,{ api: "draw-spline"
                          ,desc: "draw a spline from (500, 500) to (430, 500) with (430, 500) as a control point"
                          ,test: function(dc){dc.drawSpline(500, 500, 300, 300, 430, 500);} }
                          );

var fonts   = new Array({ api: "draw-text"
                        ,desc: "draw some text in the default family"
                        ,test: function(dc){dc.setFont(new Font(18, "default", false, "normal", "normal", false)); dc.drawText("testing DC implementation", 0, 0, false, 0);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the decorative style, but with a Comic Sans MS font, underlined"
                        ,test: function(dc){dc.setFont(new Font(18, "decorative", "Comic Sans MS", "normal", "normal", true, null)); dc.drawText("testing DC implementation", 0, 50, false, 2);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the roman family, italic"
                        ,test: function(dc){dc.setFont(new Font(18, "roman", false, "italic", "normal", false)); dc.drawText("testing DC implementation", 0, 100, false, 4);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the script family"
                        ,test: function(dc){dc.setFont(new Font(18, "script", false, "normal", "normal", false)); dc.drawText("testing DC implementation", 0, 150, false, 6);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the swiss family, italic and underline"
                        ,test: function(dc){dc.setFont(new Font(18, "swiss", false, "italic", "normal", true)); dc.drawText("testing DC implementation", 0, 200, false, 8);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the modern family"
                        ,test: function(dc){dc.setFont(new Font(18, "modern", false, "normal", "normal", false)); dc.drawText("testing DC implementation", 0, 250, false, 10);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the symbol family, italic"
                        ,test: function(dc){dc.setFont(new Font(18, "symbol", false, "italic", "normal", false)); dc.drawText("testing DC implementation", 0, 300, false, 12);} }
                        ,{api: "draw-text"
                        ,desc: "draw some text in the system family, underline"
                        ,test: function(dc){dc.setFont(new Font(18, "system", false, "normal", "normal", true)); dc.drawText("testing DC implementation", 0, 350, false, 14);} }                        
                        ,{ api:"get-text-background"
                        ,desc: ""
                        ,test: function(dc){return dc.getTextBackground();}}
                        ,{ api:"get-text-foreground"
                        ,desc: ""
                        ,test: function(dc){return dc.getTextForeground();}}
                        ,{ api:"get-text-extent"
                        ,desc: ""
                        ,test: function(dc){return dc.getTextExtent("cookie crisp", new Font(60, "decorative", false, "normal", "normal", false, null), false, 2);}
                        ,expected: [252, 74, 14, 14]}
                        ,{ api:"get-text-mode"
                        ,desc: ""
                        ,test: function(dc){return dc.getTextMode();}}
                        ,{ api:"glyph-exists"
                        ,desc: "We expect false, using charCode(-1)"
                        ,test: function(dc){return dc.glyphExists(String.fromCharCode(-1));}
                        ,expected: false}
                        ,{ api:"glyph-exists"
                        ,desc: "We expect true, using charCode(99)"
                        ,test: function(dc){return dc.glyphExists(String.fromCharCode(99));}
                        ,expected: true}
                        ,{ api:"screen-glyph-exists"
                        ,desc: "We expect false, using charCode(-1)"
                        ,test: function(dc){return dc.getFont().screenGlyphExists(String.fromCharCode(-1));}
                        ,expected: false}
                        ,{ api:"screen-glyph-exists"
                        ,desc: "We expect true, using charCode(99)"
                        ,test: function(dc){return dc.getFont().screenGlyphExists(String.fromCharCode(99));}
                        ,expected: true}
                        );

var properties=new Array( { api: "set-alpha"
                         ,desc: "setting alpha to 0.5"
                         ,test: function(dc){dc.setAlpha(0.5)}}
                         ,{ api: "get-alpha"
                         ,desc: "should retrieve 0.5"
                         ,test: function(dc){return dc.getAlpha(); }
                         ,expected: 0.5}
                         ,{ api:"set-background"
                         ,desc: "setting the background color to #00f"
                         ,test: function(dc){dc.setBackground('#00f');}}
                         ,{ api:"get-background"
                         ,desc: "should retrieve #00f"
                         ,test: function(dc){return dc.getBackground();}
                         ,expected: '#00f'}
                         ,{ api:"set-brush"
                         ,desc: "setting brush to ????"
                         ,test: function(dc){dc.setBrush();}}
                         ,{ api:"get-brush"
                         ,desc: "should retrieve ????"
                         ,test: function(dc){return dc.getBrush();}
                         ,expected: null}
                         ,{ api:"get-char-height"
                         ,desc: ""
                         ,test: function(dc){return dc.getCharHeight();}}
                         ,{ api:"get-char-width"
                         ,desc: ""
                         ,test: function(dc){return dc.getCharWidth();}}
                         ,{ api:"set-clipping-rect"
                         ,desc: "setting clipping rect to a 100x100 rectangle, starting at (200, 200)"
                         ,test: function(dc){dc.setClippingRect(200, 200, 100, 100);}}
                         ,{ api:"set-clipping-region"
                         ,desc: "setting clipping region to ???"
                         ,test: function(dc){dc.setClippingRegion();}}
                         ,{ api:"get-clipping-region"
                         ,desc: "should retrieve ???"
                         ,test: function(dc){return dc.getClippingRegion();}
                         ,expected: null}
                         ,{ api:"get-device-scale"
                         ,desc: ""
                         ,test: function(dc){return dc.getDeviceScale();}}
                         ,{ api:"set-font"
                         ,desc: "setting font to Courier 14px"
                         ,test: function(dc){dc.setFont(new Font(14, "script", false, "normal","bold", true));}}
                         ,{ api:"get-font"
                         ,desc: "should retrieve 'script'"
                         ,test: function(dc){return dc.getFont().getFamily();}
                         ,expected: "script"}
                         ,{ api:"get-gl-context"
                         ,desc: ""
                         ,test: function(dc){return dc.getGlContext();}}
                         ,{ api:"get-pen"
                         ,desc: ""
                         ,test: function(dc){return dc.getPen();}}
                         ,{ api:"get-size"
                         ,desc: ""
                         ,test: function(dc){return dc.getSize();}}
                         ,{ api:"get-smoothing"
                         ,desc: ""
                         ,test: function(dc){return dc.getSmoothing();}}
                         );

var matrix= new Array({ api:"set-transformation"
                      ,desc: "setting transformation to [[1,1,1,1,1,1], 1,2,3,4,5]"
                      ,test: function(dc){dc.setTransformation([1,1,1,1,1,1], 1,2,3,4,5);}}
                      ,{ api:"get-transformation"
                      ,desc: "should retrieve [1,1,1,1,1,1],1,2,3,4,5"
                      ,test: function(dc){return dc.getTransformation();}
                      ,expected: "[1,1,1,1,1,1],1,2,3,4,5"}
                      ,{ api:"transform"
                      ,desc: "add the matrix [1,2,3,4,5,6] to our existing transformation"
                      ,test: function(dc){return dc.transform([1,2,3,4,5,6]);}}
                      ,{ api:"set-initial-matrix"
                      ,desc: "setting initial matrix to [1,2,3,4,5,6]"
                      ,test: function(dc){dc.setInitialMatrix([1,2,3,4,5,6]);}}
                      ,{ api:"get-initial-matrix"
                      ,desc: "should retrieve [1,2,3,4,5,6]"
                      ,test: function(dc){return dc.getInitialMatrix();}
                      ,expected: "[1,2,3,4,5,6]"}
                      ,{ api: "set-initial-matrix"
                      ,desc: "resetting matrix"
                      ,test: function(dc){ dc.setInitialMatrix([1,0,0,1,0,0]); }}
                      ,{ api:"set-origin"
                      ,desc: "setting origin to (5,5)"
                      ,test: function(dc){dc.setOrigin(5,5);}}
                      ,{ api:"get-origin"
                      ,desc: "should retrieve (5,5)"
                      ,test: function(dc){return dc.getOrigin();}
                      ,expected: [5,5]}
                      ,{ api:"set-rotation"
                      ,desc: "setting rotation to PI radians"
                      ,test: function(dc){dc.setRotation(Math.PI);}}
                      ,{ api:"get-rotation"
                      ,desc: "should retrieve Math.PI"
                      ,test: function(dc){return dc.getRotation();}
                      ,expected: -Math.PI}
                      ,{ api:"set-scale"
                      ,desc: "setting scale to 0.5, 2"
                      ,test: function(dc){dc.setScale(0.5, 2);}}
                      ,{ api:"get-scale"
                      ,desc: "should retrieve [0.5, 2]"
                      ,test: function(dc){return dc.getScale();}
                      ,expected: [0.5, 2]}
                      ,{ api:"rotate"
                      ,desc: "rotate the canvas by back to it's original orientation"
                      ,test: function(dc){dc.rotate(-Math.PI); return dc.getRotation(); }
                      ,expected: -Math.PI}
                      ,{ api:"scale"
                      ,desc: "changes the scale of the matrix, but NOT the scale values!"
                      ,test: function(dc){dc.scale(2, 0.5); return dc.getScale()}
                      ,expected: [0.5,2]}
                      );
var bitmaps= new Array({ api:"draw-bitmap"
                     ,desc: "initialize a background gradient, then draw a color image with a monochrome mask"
                       ,test: function(dc){dc.setBrush(new Brush(purple, false, new LinearGradient(0,0,500,500, new Array([0,purple],[1, black])))); dc.drawRectangle(50,50,400,400); dc.drawBitmap(i1, 0, 0, "solid", blue, BWmask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a color image with a color mask"
                     ,test: function(dc){dc.drawBitmap(i1, 151, 0, "solid", blue, ColorMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a color image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(i1, 302, 0, "solid", red, AlphaMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a monochrome image with a monochrome mask"
                     ,test: function(dc){dc.drawBitmap(BWmask, 0, 151, "solid", green, BWmask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a monochrome image with an color mask"
                     ,test: function(dc){dc.drawBitmap(BWmask, 151, 151, "solid", black, ColorMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a monochrome image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(BWmask, 302, 151, "solid", purple, AlphaMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw an alpha image with a monochrome mask"
                     ,test: function(dc){dc.drawBitmap(AlphaMask, 0, 302, "solid", blue, BWmask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw an alpha image with a color mask"
                     ,test: function(dc){dc.drawBitmap(AlphaMask, 151, 302, "solid", red, ColorMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw an alpha image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(AlphaMask, 302, 302, "solid", green, AlphaMask);}}
                     ,{api: "get-argb-pixels and set-argb-pixels"
                     ,desc: "grab the pixels and set them again, then draw the result: bootstrap icon"
                       ,test: function(dc){ var pixels = new Array(); i1.getARGBpixels(0,0,150,150, pixels); i1.setARGBpixels(0,0,150,150,pixels); dc.drawBitmap(i1, 0, 0)} }
                     ,{ api:"draw-bitmap-section"
                     ,desc: "First 100x100 pixels of Bootstrap logo should appear at (250,250)"
                     ,test: function(dc){ dc.drawBitmapSection(i1, 250, 250, 0, 0, 100, 100);} }
                     ,{ api:"save-file"
                     ,desc: "save the ColorMask as a jpeg, in a new window"
                     ,test: function(dc){ ColorMask.saveFile("new file!", "jpeg", 100)} }
                     );


var brushes= new Array({ api:"draw-rounded-rectangle1"
                       ,desc: "draw a rounded rectangle with bdiagonal-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush(red, false, false, "bdiagonal-hatch"));
                       dc.drawRoundedRectangle(0, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle2"
                       ,desc: "draw a rounded rectangle with crossdiag-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush(purple, false, false, "crossdiag-hatch"));
                       dc.drawRoundedRectangle(100, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle3"
                       ,desc: "draw a rounded rectangle with fdiagonal-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush(blue, false, false, "fdiagonal-hatch"));
                       dc.drawRoundedRectangle(200, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle4"
                       ,desc: "draw a rounded rectangle with cross-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush(green, false, false, "cross-hatch"));
                       dc.drawRoundedRectangle(300, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle5"
                       ,desc: "draw a rounded rectangle with vertical-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush(purple, false, false, "vertical-hatch"));
                       dc.drawRoundedRectangle(0, 100, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle6"
                       ,desc: "draw a rounded rectangle with horiztonal-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush(black, false, false, "horizontal-hatch"));
                       dc.drawRoundedRectangle(100, 100, 100, 100, 20);}}
                       );

var gradients= new Array({ api:"new linear-gradient"
                       ,desc: "make a linear gradient going from red to green to blue"
                         ,test: function(dc){var g = new LinearGradient(0,200,200,0, new Array([0, red], [0.5, green], [1, blue])); dc.setBrush(new Brush(red, false, g)); dc.drawEllipse(0,0,200,200);}}
                         ,{ api:"new radial-gradient"
                         ,desc: "make a radial gradient going from red to green to blue"
                         ,test: function(dc){var g = new RadialGradient(400, 400,50,400,400,150, new Array([0, red], [0.5, green], [1, blue])); dc.setBrush(new Brush(red, false, g)); dc.drawRectangle(250,250,200,200);}}
                       );

// build some points
var points = [new Point(0, 100),new Point(35,140),new Point(75, 25),new Point(115, 110),new Point(150, 70)]
var pens = new Array({ api: "draw-lines"
                     ,desc: "default zigzag lines"
                     ,test: function(dc){ dc.drawLines(points);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick pen)"
                     ,test: function(dc){ dc.setPen(new Pen(blue,10)); dc.drawLines(points, 0, 50);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, butt)"
                     ,test: function(dc){ dc.setPen(new Pen(red,10,"solid","butt")); dc.drawLines(points, 0, 100);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, projecting)"
                     ,test: function(dc){ dc.setPen(new Pen(green,10,"solid","projecting")); dc.drawLines(points, 0, 150);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, projecting, round)"
                     ,test: function(dc){ dc.setPen(new Pen(purple,10,"solid","projecting")); dc.drawLines(points, 0, 200);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, projecting, bevel)"
                     ,test: function(dc){ dc.setPen(new Pen(black,10,"solid","projecting", "bevel")); dc.drawLines(points, 0, 250);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, projecting, miter)"
                     ,test: function(dc){ dc.setPen(new Pen(red,10,"solid","projecting","miter")); dc.drawLines(points, 0, 300);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, projecting, miter, transparent) -- should be invisible"
                     ,test: function(dc){ dc.setPen(new Pen(green,10,"transparent","projecting","miter")); dc.drawLines(points, 0, 350);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines (thick, projecting, miter, hilite) -- should be 30% translucent"
                     ,test: function(dc){ dc.setPen(new Pen(blue,10,"hilite","projecting","miter")); dc.drawLines(points, 0, 400);} }
                     // styles that are dotted or dashed...
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines - dot purple"
                     ,test: function(dc){ dc.setPen(new Pen(purple,10,"dot","butt")); dc.drawLines(points, 200, 50);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines - long-dash red"
                     ,test: function(dc){ dc.setPen(new Pen(red,10,"long-dash","butt")); dc.drawLines(points, 200, 100);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines - short-dash black"
                     ,test: function(dc){ dc.setPen(new Pen(black,10,"short-dash","butt")); dc.drawLines(points, 200, 150);} }
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines - dot-dash red"
                     ,test: function(dc){ dc.setPen(new Pen(red,10,"dot-dash","butt")); dc.drawLines(points, 200, 200);} }
                     // custom stipple
                     ,{ api: "draw-lines"
                     ,desc: "zigzag lines - solid blue, with a custom stipple"
                     ,test: function(dc){ dc.setPen(new Pen(green,10,"solid","butt","bevel",BWmask)); dc.drawLines(points, 200, 250);} }

);
