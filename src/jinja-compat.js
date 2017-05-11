function installCompat() {
    'use strict';

    // This must be called like `nunjucks.installCompat` so that `this`
    // references the nunjucks instance
    var runtime = this.runtime; // jshint ignore:line
    var lib = this.lib; // jshint ignore:line
    var Compiler = this.compiler.Compiler; // jshint ignore:line
    var Parser = this.parser.Parser; // jshint ignore:line
    var nodes = this.nodes; // jshint ignore:line
    var lexer = this.lexer; // jshint ignore:line

    var orig_contextOrFrameLookup = runtime.contextOrFrameLookup;
    var orig_Compiler_assertType = Compiler.prototype.assertType;
    var orig_Parser_parseAggregate = Parser.prototype.parseAggregate;
    var orig_memberLookup = runtime.memberLookup;

    function uninstall() {
        runtime.contextOrFrameLookup = orig_contextOrFrameLookup;
        Compiler.prototype.assertType = orig_Compiler_assertType;
        Parser.prototype.parseAggregate = orig_Parser_parseAggregate;
        runtime.memberLookup = orig_memberLookup;
    }

    runtime.contextOrFrameLookup = function(context, frame, key) {
        var val = orig_contextOrFrameLookup.apply(this, arguments);
        if (val === undefined) {
            switch (key) {
            case 'True':
                return true;
            case 'False':
                return false;
            case 'None':
                return null;
            }
        }

        return val;
    };

    var Slice = nodes.Node.extend('Slice', {
        fields: ['start', 'stop', 'step'],
        init: function(lineno, colno, start, stop, step) {
            start = start || new nodes.Literal(lineno, colno, null);
            stop = stop || new nodes.Literal(lineno, colno, null);
            step = step || new nodes.Literal(lineno, colno, 1);
            this.parent(lineno, colno, start, stop, step);
        }
    });

    Compiler.prototype.assertType = function(node) {
        if (node instanceof Slice) {
            return;
        }
        return orig_Compiler_assertType.apply(this, arguments);
    };
    Compiler.prototype.compileSlice = function(node, frame) {
        this.emit('(');
        this._compileExpression(node.start, frame);
        this.emit('),(');
        this._compileExpression(node.stop, frame);
        this.emit('),(');
        this._compileExpression(node.step, frame);
        this.emit(')');
    };

    function getTokensState(tokens) {
        return {
            index: tokens.index,
            lineno: tokens.lineno,
            colno: tokens.colno
        };
    }

    Parser.prototype.parseAggregate = function() {
        var self = this;
        var origState = getTokensState(this.tokens);
        // Set back one accounting for opening bracket/parens
        origState.colno--;
        origState.index--;
        try {
            return orig_Parser_parseAggregate.apply(this);
        } catch(e) {
            var errState = getTokensState(this.tokens);
            var rethrow = function() {
                lib.extend(self.tokens, errState);
                return e;
            };

            // Reset to state before original parseAggregate called
            lib.extend(this.tokens, origState);
            this.peeked = false;

            var tok = this.peekToken();
            if (tok.type !== lexer.TOKEN_LEFT_BRACKET) {
                throw rethrow();
            } else {
                this.nextToken();
            }

            var node = new Slice(tok.lineno, tok.colno);

            // If we don't encounter a colon while parsing, this is not a slice,
            // so re-raise the original exception.
            var isSlice = false;

            for (var i = 0; i <= node.fields.length; i++) {
                if (this.skip(lexer.TOKEN_RIGHT_BRACKET)) {
                    break;
                }
                if (i === node.fields.length) {
                    if (isSlice) {
                        this.fail('parseSlice: too many slice components', tok.lineno, tok.colno);
                    } else {
                        break;
                    }
                }
                if (this.skip(lexer.TOKEN_COLON)) {
                    isSlice = true;
                } else {
                    var field = node.fields[i];
                    node[field] = this.parseExpression();
                    isSlice = this.skip(lexer.TOKEN_COLON) || isSlice;
                }
            }
            if (!isSlice) {
                throw rethrow();
            }
            return new nodes.Array(tok.lineno, tok.colno, [node]);
        }
    };

    function sliceLookup(obj, start, stop, step) {
        obj = obj || [];
        if (start === null) {
            start = (step < 0) ? (obj.length - 1) : 0;
        }
        if (stop === null) {
            stop = (step < 0) ? -1 : obj.length;
        } else {
            if (stop < 0) {
                stop += obj.length;
            }
        }

        if (start < 0) {
            start += obj.length;
        }

        var results = [];

        for (var i = start; ; i += step) {
            if (i < 0 || i > obj.length) {
                break;
            }
            if (step > 0 && i >= stop) {
                break;
            }
            if (step < 0 && i <= stop) {
                break;
            }
            results.push(runtime.memberLookup(obj, i));
        }
        return results;
    }

    var ARRAY_MEMBERS = {
        pop: function(index) {
            if (index === undefined) {
                return this.pop();
            }
            if (index >= this.length || index < 0) {
                throw new Error('KeyError');
            }
            return this.splice(index, 1);
        },
        append: function(element) {
                return this.push(element);
        },
        remove: function(element) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === element) {
                    return this.splice(i, 1);
                }
            }
            throw new Error('ValueError');
        },
        count: function(element) {
            var count = 0;
            for (var i = 0; i < this.length; i++) {
                if (this[i] === element) {
                    count++;
                }
            }
            return count;
        },
        index: function(element) {
            var i;
            if ((i = this.indexOf(element)) === -1) {
                throw new Error('ValueError');
            }
            return i;
        },
        find: function(element) {
            return this.indexOf(element);
        },
        insert: function(index, elem) {
            return this.splice(index, 0, elem);
        }
    };
    var OBJECT_MEMBERS = {
        items: function() {
            var ret = [];
            for(var k in this) {
                ret.push([k, this[k]]);
            }
            return ret;
        },
        values: function() {
            var ret = [];
            for(var k in this) {
                ret.push(this[k]);
            }
            return ret;
        },
        keys: function() {
            var ret = [];
            for(var k in this) {
                ret.push(k);
            }
            return ret;
        },
        get: function(key, def) {
            var output = this[key];
            if (output === undefined) {
                output = def;
            }
            return output;
        },
        has_key: function(key) {
            return this.hasOwnProperty(key);
        },
        pop: function(key, def) {
            var output = this[key];
            if (output === undefined && def !== undefined) {
                output = def;
            } else if (output === undefined) {
                throw new Error('KeyError');
            } else {
                delete this[key];
            }
            return output;
        },
        popitem: function() {
            for (var k in this) {
                // Return the first object pair.
                var val = this[k];
                delete this[k];
                return [k, val];
            }
            throw new Error('KeyError');
        },
        setdefault: function(key, def) {
            if (key in this) {
                return this[key];
            }
            if (def === undefined) {
                def = null;
            }
            return this[key] = def;
        },
        update: function(kwargs) {
            for (var k in kwargs) {
                this[k] = kwargs[k];
            }
            return null;    // Always returns None
        }
    };
    OBJECT_MEMBERS.iteritems = OBJECT_MEMBERS.items;
    OBJECT_MEMBERS.itervalues = OBJECT_MEMBERS.values;
    OBJECT_MEMBERS.iterkeys = OBJECT_MEMBERS.keys;
    runtime.memberLookup = function(obj, val, autoescape) { // jshint ignore:line
        if (arguments.length === 4) {
            return sliceLookup.apply(this, arguments);
        }
        obj = obj || {};

        // If the object is an object, return any of the methods that Python would
        // otherwise provide.
        if (lib.isArray(obj) && ARRAY_MEMBERS.hasOwnProperty(val)) {
            return function() {return ARRAY_MEMBERS[val].apply(obj, arguments);};
        }

        if (lib.isObject(obj) && OBJECT_MEMBERS.hasOwnProperty(val)) {
            return function() {return OBJECT_MEMBERS[val].apply(obj, arguments);};
        }

        return orig_memberLookup.apply(this, arguments);
    };

    return uninstall;
}

module.exports = installCompat;
