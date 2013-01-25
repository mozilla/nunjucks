var lib = require('./lib');
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
        var val = this.variables[name];
        if(val !== undefined && val !== null) {
            return val;
        }
        return p && p.lookup(name);
    },

    push: function() {
        return new Frame(this);
    },

    pop: function() {
        return this.parent;
    }
});

function makeMacro(argNames, kwargNames, func) {
    return function() {
        var argCount = numArgs(arguments);
        var args;
        var kwargs = getKeywordArgs(arguments);

        if(argCount > argNames.length) {
            args = Array.prototype.slice.call(arguments, 0, argNames.length);

            // Positional arguments that should be passed in as
            // keyword arguments (essentially default values)
            var vals = Array.prototype.slice.call(arguments, args.length, argCount);
            for(var i=0; i<vals.length; i++) {
                if(i < kwargNames.length) {
                    kwargs[kwargNames[i]] = vals[i];
                }
            }

            args.push(kwargs);
        }
        else if(argCount < argNames.length) {
            args = Array.prototype.slice.call(arguments, 0, argCount);

            for(var i=argCount; i<argNames.length; i++) {
                var arg = argNames[i];

                // Keyword arguments that should be passed as
                // positional arguments, i.e. the caller explicitly
                // used the name of a positional arg
                args.push(kwargs[arg]);
                delete kwargs[arg];
            }

            args.push(kwargs);
        }
        else {
            args = arguments;
        }

        return func.apply(this, args);
    };
}

function makeKeywordArgs(obj) {
    obj.__keywords = true;
    return obj;
}

function getKeywordArgs(args) {
    if(args.length && args[args.length - 1].__keywords) {
        return args[args.length - 1];
    }
    return {};
}

function numArgs(args) {
    if(args.length === 0) {
        return 0;
    }
    else if(args[args.length - 1].__keywords) {
        return args.length - 1;
    }
    else {
        return args.length;
    }
}

function suppressValue(val) {
    return (val !== undefined && val !== null) ? val : "";
}

function suppressLookupValue(obj, val) {
    obj = obj || {};
    val = obj[val];

    if(typeof val === 'function') {
        return function() {
            return suppressValue(val.apply(obj, arguments));
        };
    }
    else {
        return suppressValue(val);
    }
}

function contextOrFrameLookup(context, frame, name) {
    var val = context.lookup(name);
    return (val !== undefined && val !== null) ?
        val :
        frame.lookup(name);
}

function handleError(error, lineno, colno) {
    if(error.lineno) {
        throw error;
    }
    else {
        throw new lib.TemplateError(error, lineno, colno);
    }
}

module.exports = {
    Frame: Frame,
    makeMacro: makeMacro,
    makeKeywordArgs: makeKeywordArgs,
    numArgs: numArgs,
    suppressValue: suppressValue,
    suppressLookupValue: suppressLookupValue,
    contextOrFrameLookup: contextOrFrameLookup,
    handleError: handleError,
    isArray: lib.isArray
};
