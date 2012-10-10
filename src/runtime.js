
var Object = require('./object');

// Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.
var Frame = Object.extend({
    init: function(parent) {
        this.variables = {};
        this.parent = parent;
    },

    set: function(name, val) {
        // Allow variables with dots by automatically creating the
        // nested structure
        var parts = name.split('.');
        var obj = this.variables;

        for(var i=0; i<parts.length - 1; i++) {
            var id = parts[i];

            if(!obj[id]) {
                obj[id] = {};
            }
            obj = obj[id];
        }

        obj[parts[parts.length - 1]] = val;
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

// wrapMacro returns a function that stands in for the original macro, and handles
// the translation of keyword arguments from nunjucks to javascript
var wrapMacro = function(func, name, definedArgs, catchKwargs, catchVarargs, caller) {
    var definedArgCount = definedArgs.length;

    var newMacro = function(args, kwargs) {
        var applyArgs = args.slice(0, definedArgCount);
        var applyArgCount = applyArgs.length;
        if(applyArgCount != definedArgCount) {
            var remainingArgs = definedArgs.slice(applyArgCount);
            for(var i=0; i<remainingArgs.length; i++) {
                var arg = remainingArgs[i];
                var name = arg[0];
                var defaultVal = arg[1];
                var value;
                if(kwargs.hasOwnProperty(name)) {
                    value = kwargs[name];
                } else if(defaultVal) {
                    value = defaultVal;
                } else {
                    throw new Error('parameter ' + name + ' was not provided');
                }
                applyArgs.push(value);
            }
        }
        return func.apply(null, applyArgs);
    };
    newMacro.isMacro = true;
    return newMacro;
};

function processArgs(args) {
    
}

module.exports = {
    Frame: Frame,
    wrapMacro: wrapMacro
};