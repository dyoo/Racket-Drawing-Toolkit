// given a test suite and a drawing context, run all tests
// if a value is expected, check against that value
function runTests(testSuite, dc){
    // initialize some images to use in the tests
    i1 = document.getElementById('i1');
    BWmask = document.getElementById('BWmask');
    ColorMask = document.getElementById('ColorMask');
    AlphaMask = document.getElementById('AlphaMask');
    
    var errors = new Array();
    for(i=0; i<testSuite.length; i++){
        console.log(testSuite[i].api + " : " + testSuite[i].desc);
        try{
            var result = testSuite[i].test(dc);
            if(testSuite[i].expected == undefined){
                console.log("PASSED");  
            } else { 
                if(testSuite[i].expected.toString() !== result.toString())
                    errors.push(testSuite[i].api+" FAILED:\n   expected: " + testSuite[i].expected.toString() + " but got " + result.toString()+"\n");
                else console.log("PASSED: expectations matched")
                    }
        } catch(e){errors.push(testSuite[i].api+" FAILED:\n    "+e+"\n");}
    }
    if(errors.length == 0) alert("All test pass!");
    else alert(errors.toString());
}


///////////////////// VARIOUS TESTS /////////////////////////
var drawing  =  new Array({ api: "draw-bitmap"
                          ,desc: "Bootstrap logo should appear at (0,0)"
                          ,test: function(dc){ dc.drawBitmap(i1, 0, 0)} }
                          ,{ api:"draw-bitmap-section"
                          ,desc: "Bootstrap logo should appear at (50,50)"
                          ,test: function(dc){ dc.drawBitmapSection(i1, 250, 250, 0, 0, 100, 100);} }
                          ,{ api: "draw-ellipse"
                          ,desc: "narrow, tall ellipse should appear at (300,300)"
                          ,test: function(dc){dc.drawEllipse(300, 300, 20, 150);} }
                          ,{ api: "draw-line"
                          ,desc: "line should appear going from bottom-left to upper-right"
                          ,test: function(dc){dc.drawLine(0, 500, 500, 0);} }
                          ,{ api: "draw-lines"
                          ,desc: "zigzag lines should appear somewhere around the Bootstrap logo"
                          ,test: function(dc){// build some points
                          var points = [{x:20, y: 40},{x:50, y: 40},{x:60, y: 90},{x:100, y: 100},{x:120, y: 140}]
                          dc.drawLines(points, 320, 30);} }
                          ,{ api: "draw-path"
                          ,desc: "draw a path using the same zigzag coordinates as the draw-lines test, but a lower offset"
                          ,test: function(dc){// build some points
                          var points = [{x:20, y: 40},{x:50, y: 40},{x:60, y: 90},{x:100, y: 100},{x:120, y: 140}]
                          dc.drawPath(points, 320, 130);} }
                          ,{ api: "draw-point"
                          ,desc: "a single point should appear in the bottom-right corner"
                          ,test: function(dc){dc.drawPoint(480, 480);} }
                          ,{ api: "draw-polygon"
                          ,desc: "a square should be drawn, near the middle of the DC"
                          ,test: function(dc){            // build a square
                          var points = [{x:200, y: 200},{x:300, y: 200},{x:300, y: 300},{x:200, y: 300}]
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
                          ,test: function(dc){dc.setBrush(new Brush("purple", false, false, "hilite"));} }
                          ,{ api: "draw-rounded-rectangle"
                          ,desc: "draw the a box around the first 200x200, but round the corners by 30px"
                          ,test: function(dc){dc.drawRoundedRectangle(0,100,200,200, 30);} }
                          ,{ api: "new LinearGradient"
                          ,desc: "make a brush with linear gradient"
                          ,test: function(dc){dc.setBrush(new Brush("purple", false, new LinearGradient(0,0,500,500, new Array([0,"red"],[1, "yellow"]))));} }
                          ,{ api: "draw-rounded-rectangle"
                          ,desc: "draw the a box around the first 200x200, but round the corners by 30px"
                          ,test: function(dc){dc.drawRoundedRectangle(300,300,200,200, 30);} }
                          ,{ api: "draw-spline"
                          ,desc: "draw a spline from (500, 500) to (430, 500) with (430, 500) as a control point"
                          ,test: function(dc){dc.drawSpline(500, 500, 300, 300, 430, 500);} }
                          ,{ api: "draw-text"
                          ,desc: "draw some text using the current font settings, at the bottom-right"
                          ,test: function(dc){dc.drawText("testing DC implementation", 350, 480, false, 2);} }
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
                         ,test: function(dc){dc.setFont('14px Courier');}}
                         ,{ api:"get-font"
                         ,desc: "should retrieve 'Courier 14px'"
                         ,test: function(dc){return dc.getFont();}
                         ,expected: '14px Courier'}
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
                         ,{ api:"get-text-background"
                         ,desc: ""
                         ,test: function(dc){return dc.getTextBackground();}}
                         ,{ api:"get-text-foreground"
                         ,desc: ""
                         ,test: function(dc){return dc.getTextForeground();}}
                         ,{ api:"get-text-extent"
                         ,desc: ""
                         ,test: function(dc){return dc.getTextExtent("cookie crisp", "60px Helvetica", false, 2);}
                         ,expected: [252, 69, 0, 0]}
                         ,{ api:"get-text-mode"
                         ,desc: ""
                         ,test: function(dc){return dc.getTextMode();}}
                         ,{ api:"glyph-exists"
                         ,desc: ""
                         ,test: function(dc){return dc.glyphExists();}}
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
var masks= new Array({ api:"draw-bitmap"
                     ,desc: "draw a color image with a monochrome mask"
                     ,test: function(dc){dc.drawBitmap(i1, 0, 0, "solid", "blue", BWmask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a color image with a color mask"
                     ,test: function(dc){dc.drawBitmap(i1, 151, 0, "solid", "blue", ColorMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a color image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(i1, 302, 0, "solid", "blue", AlphaMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a monochrome image with a monochrome mask"
                     ,test: function(dc){dc.drawBitmap(BWmask, 0, 151, "solid", "blue", BWmask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a color image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(BWmask, 151, 151, "solid", "blue", ColorMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw a color image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(BWmask, 302, 151, "solid", "blue", AlphaMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw an alpha image with a monochrome mask"
                     ,test: function(dc){dc.drawBitmap(AlphaMask, 0, 302, "solid", "blue", BWmask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw an alpha image with a color mask"
                     ,test: function(dc){dc.drawBitmap(AlphaMask, 151, 302, "solid", "blue", ColorMask);}}
                     ,{ api:"draw-bitmap"
                     ,desc: "draw an alpha image with an alpha mask"
                     ,test: function(dc){dc.drawBitmap(AlphaMask, 302, 302, "solid", "blue", AlphaMask);}}
                     );

var brushes= new Array({ api:"draw-rounded-rectangle1"
                       ,desc: "draw a rounded rectangle with bdiagonal-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush("red", false, false, "bdiagonal-hatch"));
                       dc.drawRoundedRectangle(0, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle2"
                       ,desc: "draw a rounded rectangle with crossdiag-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush("purple", false, false, "crossdiag-hatch"));
                       dc.drawRoundedRectangle(100, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle3"
                       ,desc: "draw a rounded rectangle with fdiagonal-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush("blue", false, false, "fdiagonal-hatch"));
                       dc.drawRoundedRectangle(200, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle4"
                       ,desc: "draw a rounded rectangle with cross-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush("green", false, false, "cross-hatch"));
                       dc.drawRoundedRectangle(300, 0, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle5"
                       ,desc: "draw a rounded rectangle with vertical-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush("pink", false, false, "vertical-hatch"));
                       dc.drawRoundedRectangle(0, 100, 100, 100, 20);}}
                       ,{ api:"draw-rounded-rectangle6"
                       ,desc: "draw a rounded rectangle with horiztonal-hatch stipple, and some color"
                       ,test: function(dc){dc.setBrush(new Brush("turquoise", false, false, "horizontal-hatch"));
                       dc.drawRoundedRectangle(100, 100, 100, 100, 20);}}
                       );

var pens = new Array();
