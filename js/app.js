
var requestAnimFrame = (window.requestAnimationFrame ||
                        window.webkitAnimationFrame ||
                        function(cb) {
                            setTimeout(cb, 1000 / 60);
                        });

$(function() {
    if($('body').attr('id') != 'home') {
        return;
    }

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var w = $('body').width();
    var h = $('.banner')[0].getBoundingClientRect().height;
    canvas.width = w;
    canvas.height = h;

    $('.banner').prepend(canvas);

    var last;
    var tris;
    var running = false;
    var MAX_SUBDIVIDE = 4;
    var EPSILON = 5;

    // generate a random color scheme for the page
    var COLOR_INDEX = Math.random() * 2 | 0;

    function vadd(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1]];
    }

    function vsub(v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1]];
    }

    function vcopy(v) {
        return [v[0], v[1]];
    }

    function vmul(v, scalar) {
        return [v[0] * scalar, v[1] * scalar];
    }

    function vrotate(v, angle) {
        var cs = Math.cos(angle);
        var sn = Math.sin(angle);
        return [
            v[0] * cs - v[1] * sn,
            v[0] * sn + v[1] * cs
        ];
    }

    function vnormalize(v) {
        var l = v[0] * v[0] + v[1] * v[1];
        if(l > 0) {
            l = 1 / Math.sqrt(l);
            return [v[0] * l, v[1] * l];
        }
        return [0, 0];
    }

    function vlength(v) {
        var l = v[0] * v[0] + v[1] * v[1];
        return Math.sqrt(l);
    }

    function vequal(v1, v2) {
        return Math.abs(v1[0] - v2[0]) < EPSILON &&
            Math.abs(v1[1] - v2[1]) < EPSILON;
    }

    function findPoint(point, cb) {
        var res;

        for(var i=0; i<tris.length; i++) {
            tris[i].findPoint(point, cb);
        }
    }

    function Spark(pos, dir, len, color) {
        this.pos = pos;
        this.origPos = vcopy(pos);
        this.dir = dir;
        this.len = len;
        this.finished = false;

        this.color = [color[0], color[1] + 60, color[2]];
    }

    Spark.prototype.update = function(dt) {
        if(!this.finished) {
            this.pos[0] += this.dir[0] * dt * 700;
            this.pos[1] += this.dir[1] * dt * 700;

            findPoint(this.pos, function(collision) {
                if(Math.random() < .75) {
                    collision.tri.startFire(collision.orient);
                }
            });

            if(vlength(vsub(this.pos, this.origPos)) >= this.len + this.len / 3) {
                this.finished = true;
            }
        }
    };

    Spark.prototype.render = function() {
        if(!this.finished) {
            ctx.strokeStyle = 'rgb(' + this.color.join(',') + ')';
            ctx.beginPath();
            ctx.moveTo(this.pos[0], this.pos[1]);
            ctx.lineTo(this.pos[0] - this.dir[0] * (this.len / 3),
                       this.pos[1] - this.dir[1] * (this.len / 3));
            ctx.stroke();
        }
    };

    function Triangle(v1, v2, v3, color, level) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
        this.point = v2;
        this.color = color || [30, (Math.random() * 20 + 40) | 0, 20];
        this.children = [];
        this.level = level || 0;
        this.sparks = [];

        this.bc = vsub(v3, v2);
        this.ba = vsub(v1, v2);

        this.bb = [Math.min(v1[0], v2[0], v3[0]),
                   Math.min(v1[1], v2[1], v3[1]),
                   Math.max(v1[0], v2[0], v3[0]),
                   Math.max(v1[1], v2[1], v3[1])];
    }

    Triangle.prototype.subdivide = function() {
        var level = this.level;

        if(Math.random() < Math.max(level - 2, 0) / MAX_SUBDIVIDE || level > MAX_SUBDIVIDE) {
            return;
        }

        var v1 = this.v1;
        var v2 = this.v2;
        var v3 = this.v3;
        var ac = [v3[0] - v1[0], v3[1] - v1[1]];
        var mid = [v1[0] + ac[0] / 2.0,
                   v1[1] + ac[1] / 2.0];

        var color = [this.color[0],
                     this.color[1] + ((Math.random() - .5) * 20 | 0),
                     this.color[2]];

        this.children = [new Triangle(v1, mid, v2, color, level + 1),
                         new Triangle(v3, mid, v2, color, level + 1)];

        this.children[0].subdivide();
        this.children[1].subdivide();
        return this;
    };

    Triangle.prototype.render = function() {
        var v1 = this.v1;
        var v2 = this.v2;
        var v3 = this.v3;
        var color = this.color;

        if(!this.children.length) {
            ctx.beginPath();
            ctx.moveTo(v1[0], v1[1]);
            ctx.lineTo(v2[0], v2[1]);
            ctx.lineTo(v3[0], v3[1]);
            ctx.fillStyle = ctx.strokeStyle = 'rgb(' + color.join(',') + ')';

            ctx.fill();
            ctx.stroke();
        }

        this.children.forEach(function(child) {
            child.render();
        });
    };

    Triangle.prototype.renderSparks = function() {
        for(var i=0, l=this.sparks.length; i<l; i++) {
            this.sparks[i].render();
        }

        for(var i=0, l=this.children.length; i<l; i++) {
            this.children[i].renderSparks();
        }
    };

    Triangle.prototype.startFire = function(atPoint) {
        if(this.sparks.length) {
            return;
        }

        var v1, v2, v3;

        if(atPoint == 'v1') {
            v1 = this.v2;
            v2 = this.v1;
            v3 = this.v3;
        }
        else if(atPoint == 'v3') {
            v1 = this.v1;
            v2 = this.v3;
            v3 = this.v2;
        }
        else {
            v1 = this.v1;
            v2 = this.v2;
            v3 = this.v3;
        }

        var ba = this.ba;
        var bc = this.bc;
        this.sparks.push(new Spark(vcopy(v2), vnormalize(bc), vlength(bc),
                                   this.color));
        this.sparks.push(new Spark(vcopy(v2), vnormalize(ba), vlength(ba),
                                   this.color));
    };

    Triangle.prototype.findPoint = function(point, cb) {
        if(this.children.length) {
            var bb = this.bb;
            if(point[0] >= bb[0] && point[1] >= bb[1] &&
               point[0] <= bb[2] && point[1] <= bb[3]) {
                for(var i=0, l=this.children.length; i<l; i++) {
                    this.children[i].findPoint(point, cb);
                }
            }
        }
        else {
            if(vequal(point, this.v1)) {
                cb({
                    tri: this,
                    orient: 'v1'
                });
            }
            else if(vequal(point, this.v2)) {
                return cb({
                    tri: this,
                    orient: 'v2'
                });
            }
            else if(vequal(point, this.v3)) {
                return cb({
                    tri: this,
                    orient: 'v3'
                });
            }
        }
    };

    Triangle.prototype.update = function(dt) {
        var sparks = this.sparks;
        var allDone = true;

        for(var i=0, l=sparks.length; i<l; i++) {
            var spark = sparks[i];
            spark.update(dt);
            allDone = allDone && spark.finished;
        }

        // Need to check to see if all of my sparks are out, and set a
        // timer to quench them. We set a timer because otherwise they
        // catch fire immediately because neighbors re-spark them.
        if(this.sparks.length && allDone && !this.quenchTimer) {
            this.quenchTimer = setTimeout(function() {
                this.sparks = [];
            }.bind(this), 1000);
        }

        if(this.dir) {
            this.v1 = vadd(this.v1, vmul(this.dir, dt));
            this.v2 = vadd(this.v2, vmul(this.dir, dt));
            this.v3 = vadd(this.v3, vmul(this.dir, dt));
        }

        if(this.fadeOut) {
            this.color[0] = Math.max(this.color[0] - this.fadeOut * dt, 0) | 0;
            this.color[1] = Math.max(this.color[1] - this.fadeOut * dt, 0) | 0;
            this.color[2] = Math.max(this.color[2] - this.fadeOut * dt, 0) | 0;
        }

        var done = true;
        if(this.children.length) {
            for(var i=0, l=this.children.length; i<l; i++) {
                done = this.children[i].update(dt) && done;
            }
        }
        else {
            done = (!this.sparks.length && !this.fadeOut) ||
                (this.fadeOut &&
                 this.color[0] == 0 &&
                 this.color[1] == 0 &&
                 this.color[2] == 0);
        }

        return done;
    };

    Triangle.prototype.getRandomLeaf = function() {
        if(this.children.length) {
            return this.children[Math.random() * this.children.length | 0].getRandomLeaf();
        }
        else {
            return this;
        }
    };


    Triangle.prototype.shootOff = function(center) {
        this.sparks = [];

        if(this.children.length) {
            for(var i=0, l=this.children.length; i<l; i++) {
                this.children[i].shootOff(center);
            }
        }
        else {
            var ab = vnormalize(vsub(this.v1, center));
            if(ab[0] < 0) {
                ab[0] = -1;
            }
            else {
                ab[0] = 1;
            }

            if(ab[1] < 0) {
                ab[1] = -1;
            }
            else {
                ab[1] = 1;
            }

            this.dir = vmul(vnormalize(ab), 500 * Math.random());
            this.fadeOut = Math.random() * 100;
        }
    };

    window.onscroll = function() {
        var y = window.pageYOffset || document.body.scrollTop;
        canvas.style.top = y / 2 + 'px';
    };

    function init() {
        tris = [];

        for(var x=0; x<w; x += h) {
            if(Math.random() < .5) {
                tris.push(
                    (new Triangle([x, 0], [x + h, 0], [x + h, h])).subdivide(),
                    (new Triangle([x, 0], [x, h], [x + h, h])).subdivide()
                );
            }
            else {
                tris.push(
                    (new Triangle([x, h], [x, 0], [x + h, 0])).subdivide(),
                    (new Triangle([x, h], [x + h, h], [x + h, 0])).subdivide()
                );
            }
        }

        tris[Math.random() * tris.length | 0].getRandomLeaf().startFire('v2');
    }

    function render() {
        running = true;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        var done = true;

        tris.forEach(function(tri) {
            done = tri.update(.016) && done;
            tri.render();
        });

        tris.forEach(function(tri) {
            tri.renderSparks();
        });

        if(!done) {
            requestAnimFrame(render);
        }
        else {
            running = false;
        }
    }

    init();
    render();

    // UI

    function showDownload() {
        window.scrollTo(0, 0);
        var rect = $('.banner canvas')[0].getBoundingClientRect();

        tris.forEach(function(tri) {
            tri.shootOff([rect.width / 2, rect.height / 2]);
        });

        $('.banner-screen').css({
            opacity: 0,
            transition: 'opacity 1s'
        });

        setTimeout(function() {
            $('.download-screen').css({
                opacity: 1,
                transition: 'opacity .5s',
                zIndex: 10,
                height: rect.height
            });

            $('.download-screen .col-sm-6').height(rect.height);
        }, 1000);

        if(!running) {
            render();
        }
    }

    $('a.download').click(function(e) {
        e.preventDefault();
        $(e.target).blur();
        showDownload();
    });

    $('.download-screen a.close').click(function() {
        $('.download-screen').css({
            opacity: 0,
            transition: 'opacity 1s'
        });
        running = false;

        setTimeout(function() {
            init();
            
            if(!running) {
                render();
            }

            $('.download-screen').css({
                zIndex: -10
            });

            $('.banner-screen').css({
                opacity: 1
            });
        }, 1000);
    });

    $('.download-screen').height(canvas.height);

    if(window.location.hash == '#download') {
        showDownload();
    }
});

function saveImage() {
    var canvas = $('canvas')[0];
    var img = canvas.toDataURL('image/png');
    var el = document.createElement('img');
    el.src = img;
    document.body.appendChild(el);
}
