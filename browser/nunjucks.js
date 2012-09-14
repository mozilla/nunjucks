(function() {
var modules = {};
(function() {

// A simple class system, more documentation to come

function extend(cls, name, props) {
    var prototype = Object.create(cls.prototype);
    var fnTest = /xyz/.test(function(){ xyz; }) ? /\bparent\b/ : /.*/;
    props = props || {};

    for(var k in props) {
        var src = props[k];
        var parent = prototype[k];

        if(typeof parent == "function" &&
           typeof src == "function" &&
           fnTest.test(src)) {
            prototype[k] = (function (src, parent) {
                return function() {
                    // Save the current parent method
                    var tmp = this.parent;

                    // Set parent to the previous method, call, and restore
                    this.parent = parent;
                    var res = src.apply(this, arguments);
                    this.parent = tmp;

                    return res;
                };
            })(src, parent);
        }
        else {
            prototype[k] = src;
        }
    }

    prototype.typename = name;

    var new_cls = function() { 
        if(prototype.init) {
            prototype.init.apply(this, arguments);
        }
    };

    new_cls.prototype = prototype;
    new_cls.prototype.constructor = new_cls;

    new_cls.extend = function(name, props) {
        if(typeof name == "object") {
            props = name;
            name = "anonymous";
        }
        return extend(new_cls, name, props);
    };

    return new_cls;
}

modules['object'] = extend(Object, "Object", {});
})();
(function() {
var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;

var exports = modules['lib'] = {};

exports.isFunction = function(obj) {
    return ObjProto.toString.call(obj) == '[object Function]';
};

exports.isArray = Array.isArray || function(obj) {
    return ObjProto.toString.call(obj) == '[object Array]';
};

exports.isString = function(obj) {
    return ObjProto.toString.call(obj) == '[object String]';
};

exports.isObject = function(obj) {
    return obj === Object(obj);
}

exports.groupBy = function(obj, val) {
    var result = {};
    var iterator = exports.isFunction(val) ? val : function(obj) { return obj[val]; };
    for(var i=0; i<obj.length; i++) {
        var value = obj[i];
        var key = iterator(value, i);
        (result[key] || (result[key] = [])).push(value);
    }
    return result;
};

exports.toArray = function(obj) {
    return Array.prototype.slice.call(obj);
};

exports.without = function(array) {
    var result = [];
    if (!array) {
        return result;
    }
    var index = -1,
    length = array.length,
    contains = exports.toArray(arguments).slice(1);

    while(++index < length) {
        if(contains.indexOf(array[index]) === -1) {
            result.push(array[index]);
        }
    }
    return result;
};

exports.extend = function(obj, obj2) {
    for(var k in obj2) {
        obj[k] = obj2[k];
    }
    return obj;
};

exports.repeat = function(char_, n) {
    var str = '';
    for(var i=0; i<n; i++) {
        str += char_;
    }
    return str;
};

exports.map = function(obj, func) {
    var results = [];
    if(obj == null) {
        return results;
    }

    if(ArrayProto.map && obj.map === ArrayProto.map) {
        return obj.map(func);
    }
    
    for(var i=0; i<obj.length; i++) {
        results[results.length] = func(value, i);
    }

    if(obj.length === +obj.length) {
        results.length = obj.length;
    }

    return results;
};
})();
(function() {

var lib = modules["lib"];

var filters = {
    abs: function(n) {
        return Math.abs(n);
    },

    batch: function(arr, linecount, fill_with) {
        var res = [];
        var tmp = [];

        for(var i=0; i<arr.length; i++) {
            if(i % linecount === 0 && tmp.length) {
                res.push(tmp);
                tmp = [];
            }

            tmp.push(arr[i]);
        }

        if(tmp.length) {
            if(fill_with) {
                for(var i=tmp.length; i<linecount; i++) {
                    tmp.push(fill_with);
                }
            }

            res.push(tmp);
        }

        return res;
    },

    capitalize: function(str) {
        str = str.toLowerCase();
        return str[0].toUpperCase() + str.slice(1);
    },

    center: function(str, width) {
        width = width || 80;

        if(str.length >= width) {
            return str;
        }

        var spaces = width - str.length;
        var pre = lib.repeat(" ", spaces/2 - spaces % 2);
        var post = lib.repeat(" ", spaces/2);
        return pre + str + post;
    },

    default: function(val, def) {
        return val ? val : def;
    },

    dictsort: function(dict, caseSens, by) {
        by = by || 'key';
    },

    escape: function(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    filesizeformat: function(val, binary) {
    },

    first: function(arr) {
        return arr[0];
    },

    forceescape: function(val) {

    },

    format: function(str /*, vals */) {
        var args = lib.toArray(arguments).slice(1);
    },

    groupby: function(arr, attr) {
        return lib.groupBy(arr, attr);
    },

    indent: function(str, width, indentfirst) {
        width = width || 4;
    },

    join: function(val, d, attr) {
        d = d || '';
    },

    last: function(arr) {
    },

    length: function(arr) {
        return arr.length;
    },

    list: function(val) {
    },

    lower: function(str) {
    },

    pprint: function(val) {
    },

    random: function(arr) {
    },

    replace: function(str, old, new_, count) {
    },

    reverse: function(str) {
    },

    round: function(val, precision, method) {
        method = method || 'common';
    },

    safe: function(str) {
    },

    slice: function(arr, slices, fillWith) {
    },

    sort: function(arr, reverse, caseSens, attr) {
    },

    string: function(obj) {
        return obj.toString();
    },

    striptags: function(val) {
    },

    sum: function(arr, attr, start) {
    },
    
    title: function(str) {
        return str.toUpperCase();
    },

    trim: function(str) {

    },

    truncate: function(str, length, killWords, end) {
        length = length || 255;
        end = end || '...';
    },

    upper: function(str) {
        return str.toUpperCase();
    },

    urlize: function(str, trimLimit, noFollow) {
    },

    wordcount: function(str) {
    },

    wordwrap: function(str, width, breakWords) {
        width = width || 79;
    },

    xmlattr: function(dict, autospace) {
    },

    float: function(val, def) {
    },
    
    int: function(val, def) {
    },
};

// Aliases
filters.d = filters.default;
filters.e = filters.escape;

modules['filters'] = filters;
})();
(function() {

var Object = modules["object"];

// Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.
var Frame = Object.extend({
    init: function(parent) {
        this.variables = {};
        this.parent = parent;
    },

    addVariable: function(name, id) {
        this.variables[name] = id;
    },

    lookup: function(name) {
        var p = this.parent;
        return this.variables[name] || (p && p.lookup(name));
    },

    push: function() {
        return new Frame(this);
    },

    pop: function() {
        return this.parent;
    }
});

modules['runtime'] = { 
    Frame: Frame
};
})();
(function() {

var lib = modules["lib"];
var Object = modules["object"];
var compiler = modules["compiler"];
var builtin_filters = modules["filters"];
var builtin_loaders = modules["loaders"];
var Frame = modules["runtime"].Frame;

var Environment = Object.extend({
    init: function(loaders) {
        if(!loaders) {
            // The filesystem loader is only available client-side
            if(builtin_loaders.FileSystemLoader) {
                this.loaders = [new builtin_loaders.FileSystemLoader()];
            }
            else {
                this.loaders = [new builtin_loaders.HttpLoader()];
            }
        }
        else {
            this.loaders = lib.isArray(loaders) ? loaders : [loaders];
        }

        this.filters = builtin_filters;
        this.cache = {};
    },

    addFilter: function(name, func) {
        this.filters[name] = func;
    },

    getFilter: function(name) {
        return this.filters[name];
    },

    getTemplate: function(name, eagerCompile) {
        var info = null;
        var tmpl = this.cache[name];
        var upToDate;

        if(!tmpl || !tmpl.isUpToDate()) {
            for(var i=0; i<this.loaders.length; i++) {
                if((info = this.loaders[i].getSource(name))) {
                    break;
                }
            }

            if(!info) {
                throw new Error('template not found: ' + name);
            }

            this.cache[name] = new Template(info.src,
                                            this,
                                            info.path,
                                            info.upToDate,
                                            eagerCompile);
        }

        return this.cache[name];
    },

    registerPrecompiled: function(templates) {
        for(var name in templates) {
            this.cache[name] = new Template({ type: 'code',
                                              obj: templates[name] },
                                            this,
                                            name,
                                            function() { return true; },
                                            true);
        }
    },

    express: function(app) {
        var env = this;

        app.render = function(name, ctx, k) {
            var context = {};

            if(lib.isFunction(ctx)) {
                k = ctx;
                ctx = {};
            }

            context = lib.extend(context, app.locals);

            if(ctx._locals) {
                context = lib.extend(context, ctx._locals);
            }

            context = lib.extend(context, ctx);

            var res = env.getTemplate(name).render(ctx);
            k(null, res);            
        };
    }
});

var Context = Object.extend({
    init: function(ctx, blocks) {
        this.ctx = ctx;
        this.blocks = {};

        for(var name in blocks) {
            this.addBlock(name, blocks[name]);
        }
    },

    lookup: function(name) {
        return this.ctx[name];
    },

    getVariables: function() {
        return this.ctx;
    },

    addBlock: function(name, block) {
        this.blocks[name] = this.blocks[name] || [];
        this.blocks[name].push(block);
    },

    getBlock: function(name) {
        if(!this.blocks[name]) {
            throw new Error('unknown block "' + name + '"');
        }

        return this.blocks[name][0];
    },

    getSuper: function(env, name, block) {
        var idx = (this.blocks[name] || []).indexOf(block);
        var blk = this.blocks[name][idx + 1];
        var context = this;

        return function() {
            if(idx == -1 || !blk) {
                throw new Error('no super block available for "' + name + '"');
            }

            return blk(env, context);
        };
    }
});

var Template = Object.extend({
    init: function (src, env, path, upToDate, eagerCompile) {
        this.env = env || new Environment();

        if(lib.isObject(src)) {
            switch(src.type) {
            case 'code': this.tmplProps = src.obj; break;
            case 'string': this.tmplStr = src.obj; break;
            }
        }
        else if(lib.isString(src)) {
            this.tmplStr = src;
        }
        else {
            throw new Error("src must be a string or an object describing " +
                            "the source");
        }

        this.path = path;
        this.upToDate = upToDate || function() { return false; };

        if(eagerCompile) {
            this._compile();
        }
        else {
            this.compiled = false;
        }
    },

    render: function(ctx, frame) {
        if(!this.compiled) {
            this._compile();
        }

        var context = new Context(ctx || {}, this.blocks);
        return this.rootRenderFunc(this.env,
                                   context,
                                   frame || new Frame());
    },

    isUpToDate: function() {
        return this.upToDate();
    },

    _compile: function() {
        var props;

        if(this.tmplProps) {
            props = this.tmplProps;
        }
        else {
            var func = new Function(compiler.compile(this.tmplStr, this.env));
            props = func();
        }
        
        this.blocks = this._getBlocks(props);
        this.rootRenderFunc = props.root;
        this.compiled = true;
    },

    _getBlocks: function(props) {
        var blocks = {};

        for(var k in props) {
            if(k.slice(0, 2) == 'b_') {
                blocks[k.slice(2)] = props[k];
            }
        }

        return blocks;
    }
});

// var fs = modules["fs"];
// var env = new Environment();
// console.log(compiler.compile(fs.readFileSync('test.html', 'utf-8')));

// var tmpl = env.getTemplate('test.html');
// console.log("OUTPUT ---");
// console.log(tmpl.render({ username: "James" }));

modules['environment'] = {
    Environment: Environment,
    Template: Template
};
})();

var env = modules["environment"];
var compiler = modules["compiler"];
var parser = modules["parser"];
var lexer = modules["lexer"];
var loaders = modules["loaders"];

window.nunjucks = {};
window.nunjucks.Environment = env.Environment;
window.nunjucks.Template = env.Template;

window.nunjucks.loaders = loaders;
window.nunjucks.compiler = compiler;
window.nunjucks.parser = parser;
window.nunjucks.lexer = lexer;

window.nunjucks.require =
   function(name) { return modules[name]; };

})();
