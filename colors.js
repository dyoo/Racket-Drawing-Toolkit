// Color : Number Number Number -> Color
// implements color%, as defined in http://docs.racket-lang.org/draw/color_.html?q=dc
function Color(r, g, b, a){
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = (a==undefined)? 1 : a;
    this.red = function(){return this.r;}
    this.green = function(){return this.g;}
    this.blue = function(){return this.b;}
    this.alpha = function(){return this.a;}
    
    function valid(v){return v>=0 && v<=255;}
    
    this.ok = function(){ 
        return valid(this.r) && valid(this.g) && valid(this.b)
        && this.alpha >=0 && this.alpha <=1;
    }
    this.set = function (r, g, b, a){
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;        
    }
    this.copyFrom = function (c){
        this.set(c.red(), c.green(). c.blue(), c.alpha());
    }
    
    this.getRGBA = function(){
//        alert("returning rgba("+this.r+", "+this.g+", "+this.b+", "+this.a+")")
        return "rgba("+this.r+", "+this.g+", "+this.b+", "+this.a+")";};
    return this;
}




// ColorDatabase : void -> this
// implements color-database%, as defined in http://docs.racket-lang.org/draw/color-database___.html
function ColorDatabase() {
    this.colors = {};
    this.findColor = function(name){
        if(this.colors[name]==undefined) return false;
    }
    this.put = function(name, color) { this.colors[name] = color;};

    this.put("ORANGE", new Color(255, 165, 0));
    this.put("RED", new Color(255, 0, 0));
    this.put("ORANGERED", new Color(255, 69, 0));
    this.put("TOMATO", new Color(255, 99, 71));
    this.put("DARKRED", new Color(139, 0, 0));
    this.put("RED", new Color(255, 0, 0));
    this.put("FIREBRICK", new Color(178, 34, 34));
    this.put("CRIMSON", new Color(220, 20, 60));
    this.put("DEEPPINK", new Color(255, 20, 147));
    this.put("MAROON", new Color(176, 48, 96));
    this.put("INDIAN RED", new Color(205, 92, 92));
    this.put("INDIANRED", new Color(205, 92, 92));
    this.put("MEDIUM VIOLET RED", new Color(199, 21, 133));
    this.put("MEDIUMVIOLETRED", new Color(199, 21, 133));
    this.put("VIOLET RED", new Color(208, 32, 144));
    this.put("VIOLETRED", new Color(208, 32, 144));
    this.put("LIGHTCORAL", new Color(240, 128, 128));
    this.put("HOTPINK", new Color(255, 105, 180));
    this.put("PALEVIOLETRED", new Color(219, 112, 147));
    this.put("LIGHTPINK", new Color(255, 182, 193));
    this.put("ROSYBROWN", new Color(188, 143, 143));
    this.put("PINK", new Color(255, 192, 203));
    this.put("ORCHID", new Color(218, 112, 214));
    this.put("LAVENDERBLUSH", new Color(255, 240, 245));
    this.put("SNOW", new Color(255, 250, 250));
    this.put("CHOCOLATE", new Color(210, 105, 30));
    this.put("SADDLEBROWN", new Color(139, 69, 19));
    this.put("BROWN", new Color(132, 60, 36));
    this.put("DARKORANGE", new Color(255, 140, 0));
    this.put("CORAL", new Color(255, 127, 80));
    this.put("SIENNA", new Color(160, 82, 45));
    this.put("ORANGE", new Color(255, 165, 0));
    this.put("SALMON", new Color(250, 128, 114));
    this.put("PERU", new Color(205, 133, 63));
    this.put("DARKGOLDENROD", new Color(184, 134, 11));
    this.put("GOLDENROD", new Color(218, 165, 32));
    this.put("SANDYBROWN", new Color(244, 164, 96));
    this.put("LIGHTSALMON", new Color(255, 160, 122));
    this.put("DARKSALMON", new Color(233, 150, 122));
    this.put("GOLD", new Color(255, 215, 0));
    this.put("YELLOW", new Color(255, 255, 0));
    this.put("OLIVE", new Color(128, 128, 0));
    this.put("BURLYWOOD", new Color(222, 184, 135));
    this.put("TAN", new Color(210, 180, 140));
    this.put("NAVAJOWHITE", new Color(255, 222, 173));
    this.put("PEACHPUFF", new Color(255, 218, 185));
    this.put("KHAKI", new Color(240, 230, 140));
    this.put("DARKKHAKI", new Color(189, 183, 107));
    this.put("MOCCASIN", new Color(255, 228, 181));
    this.put("WHEAT", new Color(245, 222, 179));
    this.put("BISQUE", new Color(255, 228, 196));
    this.put("PALEGOLDENROD", new Color(238, 232, 170));
    this.put("BLANCHEDALMOND", new Color(255, 235, 205));
    this.put("MEDIUM GOLDENROD", new Color(234, 234, 173));
    this.put("MEDIUMGOLDENROD", new Color(234, 234, 173));
    this.put("PAPAYAWHIP", new Color(255, 239, 213));
    this.put("MISTYROSE", new Color(255, 228, 225));
    this.put("LEMONCHIFFON", new Color(255, 250, 205));
    this.put("ANTIQUEWHITE", new Color(250, 235, 215));
    this.put("CORNSILK", new Color(255, 248, 220));
    this.put("LIGHTGOLDENRODYELLOW", new Color(250, 250, 210));
    this.put("OLDLACE", new Color(253, 245, 230));
    this.put("LINEN", new Color(250, 240, 230));
    this.put("LIGHTYELLOW", new Color(255, 255, 224));
    this.put("SEASHELL", new Color(255, 245, 238));
    this.put("BEIGE", new Color(245, 245, 220));
    this.put("FLORALWHITE", new Color(255, 250, 240));
    this.put("IVORY", new Color(255, 255, 240));
    this.put("GREEN", new Color(0, 255, 0));
    this.put("LAWNGREEN", new Color(124, 252, 0));
    this.put("CHARTREUSE", new Color(127, 255, 0));
    this.put("GREEN YELLOW", new Color(173, 255, 47));
    this.put("GREENYELLOW", new Color(173, 255, 47));
    this.put("YELLOW GREEN", new Color(154, 205, 50));
    this.put("YELLOWGREEN", new Color(154, 205, 50));
    this.put("MEDIUM FOREST GREEN", new Color(107, 142, 35));
    this.put("OLIVEDRAB", new Color(107, 142, 35));
    this.put("MEDIUMFORESTGREEN", new Color(107, 142, 35));
    this.put("DARK OLIVE GREEN", new Color(85, 107, 47));
    this.put("DARKOLIVEGREEN", new Color(85, 107, 47));
    this.put("DARKSEAGREEN", new Color(143, 188, 139));
    this.put("LIME", new Color(0, 255, 0));
    this.put("DARK GREEN", new Color(0, 100, 0));
    this.put("DARKGREEN", new Color(0, 100, 0));
    this.put("LIME GREEN", new Color(50, 205, 50));
    this.put("LIMEGREEN", new Color(50, 205, 50));
    this.put("FOREST GREEN", new Color(34, 139, 34));
    this.put("FORESTGREEN", new Color(34, 139, 34));
    this.put("SPRING GREEN", new Color(0, 255, 127));
    this.put("SPRINGGREEN", new Color(0, 255, 127));
    this.put("MEDIUM SPRING GREEN", new Color(0, 250, 154));
    this.put("MEDIUMSPRINGGREEN", new Color(0, 250, 154));
    this.put("SEA GREEN", new Color(46, 139, 87));
    this.put("SEAGREEN", new Color(46, 139, 87));
    this.put("MEDIUM SEA GREEN", new Color(60, 179, 113));
    this.put("MEDIUMSEAGREEN", new Color(60, 179, 113));
    this.put("AQUAMARINE", new Color(112, 216, 144));
    this.put("LIGHTGREEN", new Color(144, 238, 144));
    this.put("PALE GREEN", new Color(152, 251, 152));
    this.put("PALEGREEN", new Color(152, 251, 152));
    this.put("MEDIUM AQUAMARINE", new Color(102, 205, 170));
    this.put("MEDIUMAQUAMARINE", new Color(102, 205, 170));
    this.put("TURQUOISE", new Color(64, 224, 208));
    this.put("LIGHTSEAGREEN", new Color(32, 178, 170));
    this.put("MEDIUM TURQUOISE", new Color(72, 209, 204));
    this.put("MEDIUMTURQUOISE", new Color(72, 209, 204));
    this.put("HONEYDEW", new Color(240, 255, 240));
    this.put("MINTCREAM", new Color(245, 255, 250));
    this.put("ROYALBLUE", new Color(65, 105, 225));
    this.put("DODGERBLUE", new Color(30, 144, 255));
    this.put("DEEPSKYBLUE", new Color(0, 191, 255));
    this.put("CORNFLOWERBLUE", new Color(100, 149, 237));
    this.put("STEEL BLUE", new Color(70, 130, 180));
    this.put("STEELBLUE", new Color(70, 130, 180));
    this.put("LIGHTSKYBLUE", new Color(135, 206, 250));
    this.put("DARK TURQUOISE", new Color(0, 206, 209));
    this.put("DARKTURQUOISE", new Color(0, 206, 209));
    this.put("CYAN", new Color(0, 255, 255));
    this.put("AQUA", new Color(0, 255, 255));
    this.put("DARKCYAN", new Color(0, 139, 139));
    this.put("TEAL", new Color(0, 128, 128));
    this.put("SKY BLUE", new Color(135, 206, 235));
    this.put("SKYBLUE", new Color(135, 206, 235));
    this.put("CADET BLUE", new Color(96, 160, 160));
    this.put("CADETBLUE", new Color(95, 158, 160));
    this.put("DARK SLATE GRAY", new Color(47, 79, 79));
    this.put("DARKSLATEGRAY", new Color(47, 79, 79));
    this.put("LIGHTSLATEGRAY", new Color(119, 136, 153));
    this.put("SLATEGRAY", new Color(112, 128, 144));
    this.put("LIGHT STEEL BLUE", new Color(176, 196, 222));
    this.put("LIGHTSTEELBLUE", new Color(176, 196, 222));
    this.put("LIGHT BLUE", new Color(173, 216, 230));
    this.put("LIGHTBLUE", new Color(173, 216, 230));
    this.put("POWDERBLUE", new Color(176, 224, 230));
    this.put("PALETURQUOISE", new Color(175, 238, 238));
    this.put("LIGHTCYAN", new Color(224, 255, 255));
    this.put("ALICEBLUE", new Color(240, 248, 255));
    this.put("AZURE", new Color(240, 255, 255));
    this.put("MEDIUM BLUE", new Color(0, 0, 205));
    this.put("MEDIUMBLUE", new Color(0, 0, 205));
    this.put("DARKBLUE", new Color(0, 0, 139));
    this.put("MIDNIGHT BLUE", new Color(25, 25, 112));
    this.put("MIDNIGHTBLUE", new Color(25, 25, 112));
    this.put("NAVY", new Color(36, 36, 140));
    this.put("BLUE", new Color(0, 0, 255));
    this.put("INDIGO", new Color(75, 0, 130));
    this.put("BLUE VIOLET", new Color(138, 43, 226));
    this.put("BLUEVIOLET", new Color(138, 43, 226));
    this.put("MEDIUM SLATE BLUE", new Color(123, 104, 238));
    this.put("MEDIUMSLATEBLUE", new Color(123, 104, 238));
    this.put("SLATE BLUE", new Color(106, 90, 205));
    this.put("SLATEBLUE", new Color(106, 90, 205));
    this.put("PURPLE", new Color(160, 32, 240));
    this.put("DARK SLATE BLUE", new Color(72, 61, 139));
    this.put("DARKSLATEBLUE", new Color(72, 61, 139));
    this.put("DARKVIOLET", new Color(148, 0, 211));
    this.put("DARK ORCHID", new Color(153, 50, 204));
    this.put("DARKORCHID", new Color(153, 50, 204));
    this.put("MEDIUMPURPLE", new Color(147, 112, 219));
    this.put("CORNFLOWER BLUE", new Color(68, 64, 108));
    this.put("MEDIUM ORCHID", new Color(186, 85, 211));
    this.put("MEDIUMORCHID", new Color(186, 85, 211));
    this.put("MAGENTA", new Color(255, 0, 255));
    this.put("FUCHSIA", new Color(255, 0, 255));
    this.put("DARKMAGENTA", new Color(139, 0, 139));
    this.put("VIOLET", new Color(238, 130, 238));
    this.put("PLUM", new Color(221, 160, 221));
    this.put("LAVENDER", new Color(230, 230, 250));
    this.put("THISTLE", new Color(216, 191, 216));
    this.put("GHOSTWHITE", new Color(248, 248, 255));
    this.put("WHITE", new Color(255, 255, 255));
    this.put("WHITESMOKE", new Color(245, 245, 245));
    this.put("GAINSBORO", new Color(220, 220, 220));
    this.put("LIGHT GRAY", new Color(211, 211, 211));
    this.put("LIGHTGRAY", new Color(211, 211, 211));
    this.put("SILVER", new Color(192, 192, 192));
    this.put("GRAY", new Color(190, 190, 190));
    this.put("DARK GRAY", new Color(169, 169, 169));
    this.put("DARKGRAY", new Color(169, 169, 169));
    this.put("DIM GRAY", new Color(105, 105, 105));
    this.put("DIMGRAY", new Color(105, 105, 105));
    this.put("BLACK", new Color(0, 0, 0));
    
    return this;
};

