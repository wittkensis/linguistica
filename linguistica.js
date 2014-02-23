var canvas;

// Molecule Object --------------------------------------------------------
function Molecule( canvas ){
    this.canvas = canvas;
    this.id = 0;
    this.bond = null;
    this.nouns = [];
    this.self = this;
    this.el = canvas.set();
    this.action = null;

    this.addNoun = function( n ){
        n.id = this.nouns.length + 1;
        n.owner = this.self;
        n._render();
        this.nouns.push(n);
    };
    this.assemble = function( a ){
        if(a != "") this.action = a;
        var nS = null,
            nDO = null,
            nIO = null;

        // Iterate the nouns
        for(var n = 0; n < this.nouns.length; n++) {
            var noun = this.nouns[n];

            // Attach descriptors
            noun.positionDescriptors();

            // Assign to molecule roles
            if(noun.role == "s") nS = noun;
            if(noun.role == "do") nDO = noun;
            if(noun.role == "io") nIO = noun;
        }

        if(nDO !== null){
            // Bondage
            var relativeDOPos = [ 0, (nIO==null?50:150) ],
                p1 = util.getCircPoint(noun.el, 0, 90),
                p2 = [ p1[0] + relativeDOPos[0], p1[1] + relativeDOPos[1] ];
            this.bond = new Bond( p1[0], p1[1], p2[0], p2[1], this.action, 0.7 );
            this.bond.assignTo(this.self);
            this.bond._render();

            // Position direct object
            if(nDO !== null) {
                nDO.scale(0.8);
                nDO.moveTo(this.bond.options.x2, this.bond.options.y2 + nDO.el.attr("r"));
            }
            else { /* make endcap */ }

            // Position indirect object
            if(nIO !== null) {
                var pl = this.bond.getPointAtPercentLength(0.55);
                nIO.scale(0.6);
                nIO.moveTo(pl[0], pl[1]);
                this.bond.positionText(0.35);
            }
            else { /* do nothing */ }
        }
        else if(nIO !== null) {
            clog(nIO);
            nIO.el.remove();
            nIO.el_label.remove();
        }

    };
    this.findNoun = function( role ){
        for(var i=0; i < this.nouns.length; i++){
            if(this.nouns[i].role == role) return this.nouns[i];
        }
    };
    this._update = function(){
    };
}

function Item(){
    var self = this;
    return self;
}
Item.prototype = {
    owner: null,
    el: null,
    id: null,
    self: null,
    options: {}
}

// Noun Object ------------------------------------------------------------
function Noun( word, role, opt_options ){
    var _options = opt_options || {};
    this.prototype = Item;
    this.owner = _options.owner || null;
    this.options = {
        color:  (function(){
                if(opt_options !== undefined) return opt_options.color;
                else if(role == "s")    return "#333";
                else if(role == "io")   return "#999";
                else if(role == "do")   return "#333";
                else return "#000";
            }()),
        size:   _options.size || 100,
        x:      _options.x || 0,
        y:      _options.y || 0,
        font: {
            "font-family": "Helvetica",
            "font-size": 30,
            "fill": "#fff"
        }
    };
    this.word = word;
    this.role = role;

    this.id = null;
    this.self = this;
    this.el = null;
    this.el_label = null;
    this.descriptorList = [];

    this._render = function() {
        this.options.x = this.owner.canvas.width/2;
        this.options.y = this.options.size + 100;
        this.el = this.owner.canvas.circle(this.options.x, this.options.y, this.options.size)
            .attr({ fill: this.options.color, "stroke-width": 0 });

        this.el_label = this.owner.canvas.text(0, 0, this.word).attr( this.options.font );
        this._alignLabel();
    };
    this._alignLabel = function() {
        this.el_label.attr("x", this.el.attr('cx'));
        this.el_label.attr("y", this.el.attr('cy'));
    }
    this.assignTo = function( mol ) {
        this.owner = mol;
        this.id = this.owner.nouns.length + 1;
    }
    this.addDescriptor = function( desc ){
        desc.assignTo( this.owner );
        desc.attachTo( this.self );
        desc._render();
        this.descriptorList.push(desc);
    };
    this.moveTo = function( x, y ){
        this.options.x = x;
        this.options.y = y;
        this.el.attr('cx', this.options.x);
        this.el.attr('cy', this.options.y);
        
        // Position dependent elements
        this._alignLabel();
        this.positionDescriptors();
    };
    this.positionDescriptors = function(){
        var descriptors = this.descriptorList;
        for(var a = 0; a < descriptors.length; a++){
            var adj = descriptors[a],
                posAngle = (function(){
                    if(descriptors.length%2 == 0)
                        return ( 270 + a * (360 / descriptors.length) + (360 / (descriptors.length*2)) ) % 360;
                    else if(descriptors.length == 1)
                        return 0;
                    else
                        return ( 270 + a * (360 / descriptors.length) ) % 360;                                
                }()),
                nounCircCoord = util.getCircPoint( this.el, adj.options.size-15, posAngle );
            // Position and send into orbit
            adj.moveTo( nounCircCoord[0], nounCircCoord[1] );
            adj.orbit(adj.orbit);
        }
    }
    this.scale = function( p ){
        // Scale the circle and text
        this.options.size = this.el.attr("r") * p;
        this.el.attr("r", this.options.size);

        this.options.font["font-size"] = this.options.font["font-size"] * p;
        this.el_label.attr("font-size",this.options.font["font-size"]);
        this._alignLabel();
    }
}

// Descriptor Object ------------------------------------------------------
function Descriptor( word ){
    var self = this;

    this.word = word;
    this.attachment = null;
    this.owner = null;
    this.id = null;
    this.el = null;
    this.el_label = null;
    this.self = this;
    this.options = {
        size:   30,
        x:      0,
        y:      0,
        speed:  2000,
        font: {
            "font-family": "Helvetica",
            "font-size": 12,
            "fill": "#666"
        },
        style: {
            fill: "#ccc",
            "stroke-width": 3,
            stroke: "#333"
        }
    };
    this._render = function(){
        this.el = this.owner.canvas.set();
        this.options.x = this.attachment.options.x;
        this.options.y = this.attachment.options.y;
        this.el.push( this.owner.canvas.circle(this.options.x, this.options.y, this.options.size)
            .attr(this.options.style) );
        this.el.push( this.owner.canvas.text(0, 0, this.word).attr( this.options.font ) );
        this.el_label = this.el[1];
        clog(this.el_label)

        clog(this.attachment.word)

        this._alignLabel();
    };
    this._alignLabel = function() {
        this.el_label.attr("x", this.el[0].attr('cx'));
        this.el_label.attr("y", this.el[0].attr('cy'));
    };
    this.assignTo = function( mol ){
        this.owner = mol;
    };
    this.attachTo = function( noun ) {
        this.attachment = noun;
        this.id = this.attachment.descriptorList.length + 1;
    };
    this.orbit = function(){
        this.el.attr({ transform: "r0 "+this.attachment.options.x+" "+this.attachment.options.y });
        this.el.animate({ transform: "r360 "+this.attachment.options.x+" "+this.attachment.options.y }, this.options.speed, "bounce" );
    };
    this.moveTo = function( x, y ){
        // clog(this.el[0])
        self.el[0].attr('cx', x);
        self.el[0].attr('cy', y);
        this._alignLabel();
    };
    return self;
}

// // Bond Object ------------------------------------------------------
function Bond( x1, y1, x2, y2, opt_title, opt_extend ){
    this.id = null;
    this.el = null;
    this.el_label = null;
    this.opt_title = opt_title || undefined;
    this.owner = null;
    this.options = {
        color:  "#999",
        line: {
            stroke: "#ccc",
            "stroke-width": 10,
            "stroke-linecap": "square",
            "stroke-linejoin": "round",
            "stroke-opacity": 0.8
        },
        x1:      x1,
        y1:      y1,
        x2:      x2,
        y2:      y2,
        title: {
            "fill": "#eee",
            "stroke-width": 5,
            "stroke": "#999",
            "fill-opacity": 1,
            x: null,
            y: null,
            w: 150,
            h: 40,
        },
        font: {
            "font-family": "Helvetica",
            "font-size": 16,
            // "font-weight": 700,
            "fill": "#333"
        }
    };
    this._render = function(){
        // Extend?
        if(opt_extend !== undefined){
            // For now, assume n2 vectors southeast of n1.
            var xd = this.options.x2 - this.options.x1,
                yd = this.options.y2 - this.options.y1;

            this.options.x2 = this.options.x2 + (xd * opt_extend);
            this.options.y2 = this.options.y2 + (yd * opt_extend);
        }

        this.el = this.owner.canvas.path("M"+this.options.x1+" "+this.options.y1+"L"+this.options.x2+" "+this.options.y2)
            .attr(this.options.line).toBack();

        // Render title
        if(this.opt_title !== undefined){
            this.el_label = this.owner.canvas.set();

            this.options.title.y = this.options.y1 - this.options.title.h/2 - ((this.options.y1 - this.options.y2) / 2);
            this.options.title.x = this.options.x1 - this.options.title.w/2 - ((this.options.x1 - this.options.x2) / 2);

            this.el_label.push( this.owner.canvas.rect(this.options.title.x, this.options.title.y, this.options.title.w, this.options.title.h, 10).attr(this.options.title) );
            this.el_label.push(
                this.owner.canvas.text(
                    this.options.title.x + this.options.title.w / 2,
                    this.options.title.y + this.options.title.h / 2,
                    this.opt_title).attr( this.options.font )
            );
        }
    };
    this.assignTo = function( mol ){
        this.owner = mol;
    }
    this.positionText = function( p ){
        var xd = this.options.x2 - this.options.x1,
            yd = this.options.y2 - this.options.y1,
            pl = this.getPointAtPercentLength( p );

        if(this.owner.action != null) {
            // Position box
            this.options.title.x = pl[0] - this.options.title.w/2;
            this.options.title.y = pl[1] - this.options.title.h/2;
            this.el_label.attr('x', this.options.title.x);
            this.el_label.attr('y', this.options.title.y);

            // Align text to box
            this.el_label[1].attr("x", this.options.title.x + this.options.title.w/2);
            this.el_label[1].attr("y", this.options.title.y + this.options.title.h/2);
        }

    };
    this.getPointAtPercentLength = function( p ){
        var xd = this.options.x2 - this.options.x1,
            yd = this.options.y2 - this.options.y1;

        // Position box
        return [
            (p * xd) + this.options.x1,
            (p * yd) + this.options.y1
        ];
        
    };
}

function Linguistica( opt_reset ) {
    if( typeof opt_reset !== "undefined" ) {
        if( opt_reset ) util.clear( canvas.canvas );
    }

    canvas = Raphael("canvas", 600, 900); // raphael ftw
    
    var sentence = new Molecule( canvas ),
        nEl = util.$c("noun"),
        dEl = util.$c("descriptor"),
        aEl = util.$c("action");
    
    for(var i=0; i < nEl.length; i++) {
        if(nEl[i].value != "") {
            sentence.addNoun( new Noun( nEl[i].value, nEl[i].getAttribute("data-role")) );
        }
    }
    for(var i=0; i < dEl.length; i++) {
        if(dEl[i].value != ""){
            var attr = dEl[i].getAttribute("data-attachment");
            sentence.findNoun( attr ).addDescriptor( new Descriptor( dEl[i].value ) );
        }
    }
    sentence.assemble( aEl[0].value );
}

window.onload = function(){
    Linguistica();
}