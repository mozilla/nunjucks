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

    // If the object is an object, return any of the methods that Python would
    // otherwise provide.
    if (lib.isArray(obj)) {
        // Handy list methods.
        switch (val) {
            case 'pop':
                return function(index) {
                    if (index === undefined) {
                        return obj.pop();
                    }
                    if (index >= obj.length || index < 0) {
                        throw new Error('KeyError');
                    }
                    return obj.splice(index, 1);
                };
            case 'remove':
                return function(element) {
                    for (var i = 0; i < obj.length; i++) {
                        if (obj[i] == element) {
                            return obj.splice(i, 1);
                        }
                    }
                    throw new Error('ValueError');
                };
            case 'count':
                return function(element) {
                    var count = 0;
                    for (var i = 0; i < obj.length; i++) {
                        if (obj[i] == element) {
                            count++;
                        }
                    }
                    return count;
                };
            case 'index':
                return function(element) {
                    var i;
                    if ((i = obj.indexOf(element)) == -1) {
                        throw new Error('ValueError');
                    }
                    return i;
                };
            case 'find':
                return function(element) {
                    return obj.indexOf(element);
                };
            case 'insert':
                return function(index, elem) {
                    return obj.splice(index, 0, elem);
                };
        }
    }

    if (lib.isObject(obj)) {
        switch (val) {
            case 'items':
            case 'iteritems':
                return function() {
                    var ret = [];
                    for(var k in obj) {
                        ret.push([k, obj[k]]);
                    }
                    return ret;
                };

            case 'values':
            case 'itervalues':
                return function() {
                    var ret = [];
                    for(var k in obj) {
                        ret.push(obj[k]);
                    }
                    return ret;
                };

            case 'keys':
            case 'iterkeys':
                return function() {
                    var ret = [];
                    for(var k in obj) {
                        ret.push(k);
                    }
                    return ret;
                };

            case 'get':
                return function(key, def) {
                    var output = obj[key];
                    if (output === undefined) {
                        output = def;
                    }
                    return output;
                };

            case 'has_key':
                return function(key) {
                    return key in obj;
                };

            case 'pop':
                return function(key, def) {
                    var output = obj[key];
                    if (output === undefined && def !== undefined) {
                        output = def;
                    } else if (output === undefined) {
                        throw new Error('KeyError');
                    } else {
                        delete obj[key];
                    }
                    return output;
                };

            case 'popitem':
                return function() {
                    for (var k in obj) {
                        // Return the first object pair.
                        var val = obj[k];
                        delete obj[k];
                        return [k, val];
                    }
                    throw new Error('KeyError');
                };

            case 'setdefault':
                return function(key, def) {
                    if (key in obj) {
                        return obj[key]
                    }
                    if (def === undefined) {
                        def = null;
                    }
                    return obj[key] = def;
                };

            case 'update':
                return function(kwargs) {
                    for (var k in kwargs) {
                        obj[k] = kwargs[k];
                    }
                    return null;  // Always returns None
                };
        }
    }

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
