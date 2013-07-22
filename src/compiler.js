var lib = require('./lib');
var parser = require('./parser');
var nodes = require('./nodes');
var Object = require('./object');
var Frame = require('./runtime').Frame;

// These are all the same for now, but shouldn't be passed straight
// through
var compareOps = {
    '==': '==',
    '!=': '!=',
    '<': '<',
    '>': '>',
    '<=': '<=',
    '>=': '>='
};

// A common pattern is to emit binary operators
function binOpEmitter(str) {
    return function(node, frame) {
        this.compile(node.left, frame);
        this.emit(str);
        this.compile(node.right, frame);
    };
}

// Generate an array of strings
function quotedArray(arr) {
    return '[' +
        lib.map(arr, function(x) { return '"' + x + '"'; }) +
        ']';
}

var Compiler = Object.extend({
    init: function(extensions) {
        this.codebuf = [];
        this.lastId = 0;
        this.buffer = null;
        this.bufferStack = [];
        this.isChild = false;

        this.extensions = extensions || [];
    },

    fail: function (msg, lineno, colno) {
        if (lineno !== undefined) lineno += 1;
        if (colno !== undefined) colno += 1;

        throw new lib.TemplateError(msg, lineno, colno);
    },

    pushBufferId: function(id) {
        this.bufferStack.push(this.buffer);
        this.buffer = id;
        this.emit('var ' + this.buffer + ' = "";');
    },

    popBufferId: function() {
        this.buffer = this.bufferStack.pop();
    },

    emit: function(code) {
        this.codebuf.push(code);
    },

    emitLine: function(code) {
        this.emit(code + "\n");
    },

    emitLines: function() {
        lib.each(lib.toArray(arguments), function(line) {
            this.emitLine(line);
        }, this);
    },

    emitFuncBegin: function(name) {
        this.buffer = 'output';
        this.emitLine('function ' + name + '(env, context, frame, runtime) {');
        this.emitLine('var lineno = null;');
        this.emitLine('var colno = null;');
        this.emitLine('var ' + this.buffer + ' = "";');
        this.emitLine('try {');
    },

    emitFuncEnd: function(noReturn) {
        if(!noReturn) {
            this.emitLine('return ' + this.buffer + ';');
        }

        this.emitLine('} catch (e) {');
        this.emitLine('  runtime.handleError(e, lineno, colno);');
        this.emitLine('}');
        this.emitLine('}');
        this.buffer = null;
    },

    tmpid: function() {
        this.lastId++;
        return 't_' + this.lastId;
    },

    _bufferAppend: function(func) {
        this.emit(this.buffer + ' += runtime.suppressValue(');
        func.call(this);
        this.emit(', env.autoesc);\n');
    },

    _compileChildren: function(node, frame) {
        var children = node.children;
        for(var i=0, l=children.length; i<l; i++) {
            this.compile(children[i], frame);
        }
    },

    _compileAggregate: function(node, frame, startChar, endChar) {
        if(startChar) {
            this.emit(startChar);
        }

        for(var i=0; i<node.children.length; i++) {
            if(i > 0) {
                this.emit(',');
            }

            this.compile(node.children[i], frame);
        }

        if(endChar) {
            this.emit(endChar);
        }
    },

    _compileExpression: function(node, frame) {
        // TODO: I'm not really sure if this type check is worth it or
        // not.
        this.assertType(
            node,
            nodes.Literal,
            nodes.Symbol,
            nodes.Group,
            nodes.Array,
            nodes.Dict,
            nodes.FunCall,
            nodes.Filter,
            nodes.LookupVal,
            nodes.Compare,
            nodes.InlineIf,
            nodes.And,
            nodes.Or,
            nodes.Not,
            nodes.Add,
            nodes.Sub,
            nodes.Mul,
            nodes.Div,
            nodes.FloorDiv,
            nodes.Mod,
            nodes.Pow,
            nodes.Neg,
            nodes.Pos,
            nodes.Compare
        );
        this.compile(node, frame);
    },

    assertType: function(node /*, types */) {
        var types = lib.toArray(arguments).slice(1);
        var success = false;

        for(var i=0; i<types.length; i++) {
            if(node instanceof types[i]) {
                success = true;
            }
        }

        if(!success) {
            this.fail("assertType: invalid type: " + node.typename,
                      node.lineno,
                      node.colno);
        }
    },

    compileCallExtension: function(node, frame) {
        var name = node.extName;
        var args = node.args;
        var contentArgs = node.contentArgs;
        var transformedArgs = [];

        this.emit(this.buffer + ' += runtime.suppressValue(');
        this.emit('env.getExtension("' + node.extName + '")["' + node.prop + '"](');
        this.emit('context');

        if(args || contentArgs) {
            this.emit(',');
        }

        if(args) {
            if(!(args instanceof nodes.NodeList)) {
                this.fail('compileCallExtension: arguments must be a NodeList, ' +
                          'use `parser.parseSignature`');
            }

            lib.each(args.children, function(arg, i) {
                // Tag arguments are passed normally to the call. Note
                // that keyword arguments are turned into a single js
                // object as the last argument, if they exist.
                this._compileExpression(arg, frame);

                if(i != args.children.length - 1 || contentArgs) {
                    this.emit(',');
                }
            }, this);
        }

        if(contentArgs) {
            lib.each(contentArgs, function(arg, i) {
                if(i > 0) {
                    this.emit(',');
                }

                if(arg) {
                    var id = this.tmpid();

                    this.emit('function() {');
                    this.pushBufferId(id);
                    this.compile(arg, frame);
                    this.popBufferId();
                    this.emitLine('return ' + id + ';\n' +
                                  '}');
                }
                else {
                    this.emit('null');
                }
            }, this);
        }

        this.emit(')');
        this.emit(', env.autoesc);\n');
    },

    compileNodeList: function(node, frame) {
        this._compileChildren(node, frame);
    },

    compileLiteral: function(node, frame) {
        if(typeof node.value == "string") {
            var val = node.value.replace(/\\/g, '\\\\');
            val = val.replace(/"/g, '\\"');
            val = val.replace(/\n/g, "\\n");
            val = val.replace(/\r/g, "\\r");
            val = val.replace(/\t/g, "\\t");
            this.emit('"' + val  + '"');
        }
        else {
            this.emit(node.value.toString());
        }
    },

    compileSymbol: function(node, frame) {
        var name = node.value;
        var v;

        if((v = frame.lookup(name))) {
            this.emit(v);
        }
        else {
            this.emit('runtime.contextOrFrameLookup(' +
                      'context, frame, "' + name + '")');
        }
    },

    compileGroup: function(node, frame) {
        this._compileAggregate(node, frame, '(', ')');
    },

    compileArray: function(node, frame) {
        this._compileAggregate(node, frame, '[', ']');
    },

    compileDict: function(node, frame) {
        this._compileAggregate(node, frame, '{', '}');
    },

    compilePair: function(node, frame) {
        var key = node.key;
        var val = node.value;

        if(key instanceof nodes.Symbol) {
            key = new nodes.Literal(key.lineno, key.colno, key.value);
        }
        else if(!(key instanceof nodes.Literal &&
                  typeof key.value == "string")) {
            this.fail("compilePair: Dict keys must be strings or names",
                      key.lineno,
                      key.colno);
        }

        this.compile(key, frame);
        this.emit(': ');
        this._compileExpression(val, frame);
    },

    compileInlineIf: function(node, frame) {
        this.emit('(');
        this.compile(node.cond, frame);
        this.emit('?');
        this.compile(node.body, frame);
        this.emit(':');
        if(node.else_ !== null)
            this.compile(node.else_, frame);
        else
            this.emit('""');
        this.emit(')');
    },

    compileOr: binOpEmitter(' || '),
    compileAnd: binOpEmitter(' && '),
    compileAdd: binOpEmitter(' + '),
    compileSub: binOpEmitter(' - '),
    compileMul: binOpEmitter(' * '),
    compileDiv: binOpEmitter(' / '),
    compileMod: binOpEmitter(' % '),

    compileNot: function(node, frame) {
        this.emit('!');
        this.compile(node.target, frame);
    },

    compileFloorDiv: function(node, frame) {
        this.emit('Math.floor(');
        this.compile(node.left, frame);
        this.emit(' / ');
        this.compile(node.right, frame);
        this.emit(')');
    },

    compilePow: function(node, frame) {
        this.emit('Math.pow(');
        this.compile(node.left, frame);
        this.emit(', ');
        this.compile(node.right, frame);
        this.emit(')');
    },

    compileNeg: function(node, frame) {
        this.emit('-');
        this.compile(node.target, frame);
    },

    compilePos: function(node, frame) {
        this.emit('+');
        this.compile(node.target, frame);
    },

    compileCompare: function(node, frame) {
        this.compile(node.expr, frame);

        for(var i=0; i<node.ops.length; i++) {
            var n = node.ops[i];
            this.emit(' ' + compareOps[n.type] + ' ');
            this.compile(n.expr, frame);
        }
    },

    compileLookupVal: function(node, frame) {
        this.emit('runtime.memberLookup((');
        this._compileExpression(node.target, frame);
        this.emit('),');
        this._compileExpression(node.val, frame);
        this.emit(', env.autoesc)');
    },

    _getNodeName: function(node) {
        switch (node.typename) {
            case 'Symbol':
                return node.value;
            case 'FunCall':
                return 'the return value of (' + this._getNodeName(node.name) + ')';
            case 'LookupVal':
                return this._getNodeName(node.target) + '["' +
                       this._getNodeName(node.val) + '"]';
            case 'Literal':
                return node.value.toString().substr(0, 10);
            default:
                return '--expression--';
        }
    },

    compileFunCall: function(node, frame) {
        // Keep track of line/col info at runtime by settings
        // variables within an expression. An expression in javascript
        // like (x, y, z) returns the last value, and x and y can be
        // anything
        this.emit('(lineno = ' + node.lineno +
                  ', colno = ' + node.colno + ', ');

        this.emit('runtime.callWrap(');
        // Compile it as normal.
        this._compileExpression(node.name, frame);

        // Output the name of what we're calling so we can get friendly errors
        // if the lookup fails.
        this.emit(', "' + this._getNodeName(node.name).replace(/"/g, '\\"') + '", ');

        this._compileAggregate(node.args, frame, '[', '])');

        this.emit(')');
    },

    compileFilter: function(node, frame) {
        var name = node.name;
        this.assertType(name, nodes.Symbol);

        this.emit('env.getFilter("' + name.value + '").call(context, ');
        this._compileAggregate(node.args, frame);
        this.emit(')');
    },

    compileKeywordArgs: function(node, frame) {
        var names = [];

        lib.each(node.children, function(pair) {
            names.push(pair.key.value);
        });

        this.emit('runtime.makeKeywordArgs(');
        this.compileDict(node, frame);
        this.emit(')');
    },

    compileSet: function(node, frame) {
        var ids = [];

        // Lookup the variable names for each identifier and create
        // new ones if necessary
        lib.each(node.targets, function(target) {
            var name = target.value;
            var id = frame.get(name);

            if (id === null) {
                id = this.tmpid();
                frame.set(name, id);

                // Note: This relies on js allowing scope across
                // blocks, in case this is created inside an `if`
                this.emitLine('var ' + id + ';');
            }

            ids.push(id);
        }, this);

        this.emit(ids.join(' = ') + ' = ');
        this._compileExpression(node.value, frame);
        this.emitLine(';');

        lib.each(node.targets, function(target, i) {
            var id = ids[i];
            var name = target.value;

            this.emitLine('frame.set("' + name + '", ' + id + ');');

            // We are running this for every var, but it's very
            // uncommon to assign to multiple vars anyway
            this.emitLine('if(!frame.parent) {');
            this.emitLine('context.setVariable("' + name + '", ' + id + ');');
            if(name.charAt(0) != '_') {
                this.emitLine('context.addExport("' + name + '");');
            }
            this.emitLine('}');
        }, this);
    },

    compileIf: function(node, frame) {
        this.emit('if(');
        this._compileExpression(node.cond, frame);
        this.emitLine(') {');
        this.compile(node.body, frame);

        if(node.else_) {
            this.emitLine('}\nelse {');
            this.compile(node.else_, frame);
        }

        this.emitLine('}');
    },

    compileFor: function(node, frame) {
        var i = this.tmpid();
        var arr = this.tmpid();
        frame = frame.push();

        this.emitLine('frame = frame.push();');

        this.emit('var ' + arr + ' = ');
        this._compileExpression(node.arr, frame);
        this.emitLine(';');

        var loopUses = {};
        node.iterFields(function(field) {
            var lookups = field.findAll(nodes.LookupVal);

            lib.each(lookups, function(lookup) {
                if (lookup.target instanceof nodes.Symbol &&
                    lookup.target.value == 'loop' &&
                    lookup.val instanceof nodes.Literal) {
                    loopUses[lookup.val.value] = true;
                }
            });
        });

        this.emit('if(' + arr + ') {');

        if(node.name instanceof nodes.Array) {
            // key/value iteration. the user could have passed a dict
            // amd two elements to be unpacked - "for k,v in { a: b }"
            // or they could have passed an array of arrays -
            // for a,b,c in [[a,b,c],[c,d,e]] where the number of
            // elements to be unpacked is variable.
            //
            // we cant known in advance which has been passed so we
            // have to emit code that handles both cases
            this.emitLine('var ' + i + ';');

            // did they pass an array of tuples or a dict?
            this.emitLine('if (runtime.isArray(' + arr + ')) {');

            // array of tuples
            this.emitLine('for (' + i + '=0; ' + i + ' < ' + arr + '.length; '
                            + i + '++) {');

            // create one frame var for each element in the unpacking expr
            for (var u=0; u < node.name.children.length; u++) {
                var tid = this.tmpid();
                this.emitLine('var ' + tid + ' = ' + arr + '[' + i + '][' + u + ']');
                this.emitLine('frame.set("' + node.name.children[u].value
                    + '", ' + arr + '[' + i + '][' + u + ']' + ');');
                frame.set(node.name.children[u].value, tid);
            }

            if ('index' in loopUses) {
                this.emitLine('frame.set("loop.index", ' + i + ' + 1);');
            }
            if ('index0' in loopUses) {
                this.emitLine('frame.set("loop.index0", ' + i + ');');
            }
            if ('first' in loopUses) {
                this.emitLine('frame.set("loop.first", ' + i + ' === 0);');
            }

            this.compile(node.body, frame);

            this.emitLine('}'); // end for

            this.emitLine('} else {');

            // caller passed a dict
            this.emitLine(i + ' = -1;');

            var key = node.name.children[0];
            var val = node.name.children[1];
            var k = this.tmpid();
            var v = this.tmpid();

            frame.set(key.value, k);
            frame.set(val.value, v);

            this.emitLine('for(var ' + k + ' in ' + arr + ') {');
            this.emitLine(i + '++;');
            this.emitLine('var ' + v + ' = ' + arr + '[' + k + '];');
            this.emitLine('frame.set("' + key.value + '", ' + k + ');');
            this.emitLine('frame.set("' + val.value + '", ' + v + ');');
            if ('index' in loopUses) {
                this.emitLine('frame.set("loop.index", ' + i + ' + 1);');
            }
            if ('index0' in loopUses) {
                this.emitLine('frame.set("loop.index0", ' + i + ');');
            }
            if ('first' in loopUses) {
                this.emitLine('frame.set("loop.first", ' + i + ' === 0);');
            }
            this.compile(node.body, frame);

            this.emitLine('}'); // end for

            this.emitLine('}'); // end if
        }
        else {
            var v = this.tmpid();

            frame.set(node.name.value, v);

            this.emitLine('for(var ' + i + '=0; ' + i + ' < ' + arr + '.length; ' +
                          i + '++) {');
            this.emitLine('var ' + v + ' = ' + arr + '[' + i + '];');
            this.emitLine('frame.set("' + node.name.value +
                          '", ' + v + ');');
            if ('index' in loopUses) {
                this.emitLine('frame.set("loop.index", ' + i + ' + 1);');
            }
            if ('index0' in loopUses) {
                this.emitLine('frame.set("loop.index0", ' + i + ');');
            }
            if ('revindex' in loopUses) {
                this.emitLine('frame.set("loop.revindex", ' + arr + '.length - ' + i + ');');
            }
            if ('revindex0' in loopUses) {
                this.emitLine('frame.set("loop.revindex0", ' + arr + '.length - ' + i + ' - 1);');
            }
            if ('first' in loopUses) {
                this.emitLine('frame.set("loop.first", ' + i + ' === 0);');
            }
            if ('last' in loopUses) {
                this.emitLine('frame.set("loop.last", ' + i + ' === ' + arr + '.length - 1);');
            }
            if ('length' in loopUses) {
                this.emitLine('frame.set("loop.length", ' + arr + '.length);');
            }

            this.compile(node.body, frame);
            this.emitLine('}');
        }

        this.emit('}');
        this.emitLine('frame = frame.pop();');
    },

    _emitMacroBegin: function(node, frame) {
        var args = [];
        var kwargs = null;
        var funcId = 'macro_' + this.tmpid();

        // Type check the definition of the args
        lib.each(node.args.children, function(arg, i) {
            if(i === node.args.children.length - 1 &&
               arg instanceof nodes.Dict) {
                kwargs = arg;
            }
            else {
                this.assertType(arg, nodes.Symbol);
                args.push(arg);
            }
        }, this);

        var realNames = lib.map(args, function(n) { return 'l_' + n.value; });
        realNames.push('kwargs');

        // Quoted argument names
        var argNames = lib.map(args, function(n) { return '"' + n.value + '"'; });
        var kwargNames = lib.map((kwargs && kwargs.children) || [],
                                 function(n) { return '"' + n.key.value + '"'; });

        // We pass a function to makeMacro which destructures the
        // arguments so support setting positional args with keywords
        // args and passing keyword args as positional args
        // (essentially default values). See runtime.js.
        this.emitLines(
            'var ' + funcId + ' = runtime.makeMacro(',
            '[' + argNames.join(', ') + '], ',
            '[' + kwargNames.join(', ') + '], ',
            'function (' + realNames.join(', ') + ') {',
            'frame = frame.push();',
            'kwargs = kwargs || {};'
        );

        // Expose the arguments to the template. Don't need to use
        // random names because the function
        // will create a new run-time scope for us
        lib.each(args, function(arg) {
            this.emitLine('frame.set("' + arg.value + '", ' +
                          'l_' + arg.value + ');');
            frame.set(arg.value, 'l_' + arg.value);
        }, this);

        // Expose the keyword arguments
        if(kwargs) {
            lib.each(kwargs.children, function(pair) {
                var name = pair.key.value;
                this.emit('frame.set("' + name + '", ' +
                          'kwargs.hasOwnProperty("' + name + '") ? ' +
                          'kwargs["' + name + '"] : ');
                this._compileExpression(pair.value, frame);
                this.emitLine(');');
            }, this);
        }

        return funcId;
    },

    _emitMacroEnd: function() {
        this.emitLine('frame = frame.pop();');
        this.emitLine('return new runtime.SafeString(' + this.buffer + ');');
        this.emitLine('});');
    },

    compileMacro: function(node, frame) {
        frame = frame.push();
        var funcId = this._emitMacroBegin(node, frame);

        // Start a new output buffer, and set the old one back after
        // we're done
        var prevBuffer = this.buffer;
        this.buffer = 'output';
        this.emitLine('var ' + this.buffer + '= "";');

        this.compile(node.body, frame);

        this._emitMacroEnd();
        this.buffer = prevBuffer;

        // Expose the macro to the templates
        var name = node.name.value;
        frame = frame.pop();
        frame.set(name, funcId);

        if(frame.parent) {
            this.emitLine('frame.set("' + name + '", ' + funcId + ');');
        }
        else {
            if(node.name.value.charAt(0) != '_') {
                this.emitLine('context.addExport("' + name + '");');
            }
            this.emitLine('context.setVariable("' + name + '", ' + funcId + ');');
        }
    },

    compileImport: function(node, frame) {
        var id = this.tmpid();
        var target = node.target.value;

        this.emit('var ' + id + ' = env.getTemplate(');
        this._compileExpression(node.template, frame);
        this.emitLine(').getExported();');
        frame.set(target, id);

        if(frame.parent) {
            this.emitLine('frame.set("' + target + '", ' + id + ');');
        }
        else {
            this.emitLine('context.setVariable("' + target + '", ' + id + ');');
        }
    },

    compileFromImport: function(node, frame) {
        this.emit('var imported = env.getTemplate(');
        this.compile(node.template, frame);
        this.emitLine(').getExported();');

        lib.each(node.names.children, function(nameNode) {
            var name;
            var alias;
            var id = this.tmpid();

            if(nameNode instanceof nodes.Pair) {
                name = nameNode.key.value;
                alias = nameNode.value.value;
            }
            else {
                name = nameNode.value;
                alias = name;
            }

            this.emitLine('if(imported.hasOwnProperty("' + name + '")) {');
            this.emitLine('var ' + id + ' = imported.' + name + ';');
            this.emitLine('} else {');
            this.emitLine('throw new Error("cannot import \'' + name + '\'")');
            this.emitLine('}');

            frame.set(alias, id);

            if(frame.parent) {
                this.emitLine('frame.set("' + alias + '", ' + id + ');');
            }
            else {
                this.emitLine('context.setVariable("' + alias + '", ' + id + ');');
            }
        }, this);
    },

    compileBlock: function(node, frame) {
        if(!this.isChild) {
            this.emitLine(this.buffer + ' += context.getBlock("' +
                          node.name.value + '")(env, context, frame, runtime);');
        }
    },

    compileExtends: function(node, frame) {
        if(this.isChild) {
            this.fail('compileExtends: cannot extend multiple times',
                      node.template.lineno,
                      node.template.colno);
        }

        this.emit('var parentTemplate = env.getTemplate(');
        this._compileExpression(node.template, frame);
        this.emitLine(', true);');

        var k = this.tmpid();

        this.emitLine('for(var ' + k + ' in parentTemplate.blocks) {');
        this.emitLine('context.addBlock(' + k +
                      ', parentTemplate.blocks[' + k + ']);');
        this.emitLine('}');

        this.isChild = true;
    },

    compileInclude: function(node, frame) {
        this.emit('var includeTemplate = env.getTemplate(');
        this._compileExpression(node.template, frame);
        this.emitLine(');');
        this.emitLine(this.buffer +
                      ' += includeTemplate.render(' +
                      'context.getVariables(), frame.push());');
    },

    compileTemplateData: function(node, frame) {
        this.compileLiteral(node, frame);
    },

    compileOutput: function(node, frame) {
        var children = node.children;
        for(var i=0, l=children.length; i<l; i++) {
            // TemplateData is a special case because it is never
            // autoescaped, so simply output it for optimization
            if(children[i] instanceof nodes.TemplateData) {
                if(children[i].value) {
                    this.emit(this.buffer + ' += ');
                    this.compileLiteral(children[i], frame);
                    this.emitLine(';');
                }
            }
            else {
                this.emit(this.buffer + ' += runtime.suppressValue(');
                this.compile(children[i], frame);
                this.emit(', env.autoesc);\n');
            }
        }
    },

    compileRoot: function(node, frame) {
        if(frame) {
            this.fail("compileRoot: root node can't have frame");
        }

        frame = new Frame();

        this.emitFuncBegin('root');
        this._compileChildren(node, frame);
        if(this.isChild) {
            this.emitLine('return ' +
                          'parentTemplate.rootRenderFunc(env, context, frame, runtime);');
        }
        this.emitFuncEnd(this.isChild);

        // When compiling the blocks, they should all act as top-level code
        this.isChild = false;

        var blocks = node.findAll(nodes.Block);
        for(var i=0; i<blocks.length; i++) {
            var block = blocks[i];
            var name = block.name.value;

            this.emitFuncBegin('b_' + name);
            this.emitLine('var l_super = runtime.markSafe(' +
                          'context.getSuper(env, ' +
                          '"' + name + '", ' +
                          'b_' + name + ', ' +
                          'frame, ' +
                          'runtime));');

            var tmpFrame = new Frame();
            tmpFrame.set('super', 'l_super');
            this.compile(block.body, tmpFrame);
            this.emitFuncEnd();
        }

        this.emitLine('return {');
        for(var i=0; i<blocks.length; i++) {
            var block = blocks[i];
            var name = 'b_' + block.name.value;
            this.emitLine(name + ': ' + name + ',');
        }
        this.emitLine('root: root\n};');
    },

    compile: function (node, frame) {
        var _compile = this["compile" + node.typename];
        if(_compile) {
            _compile.call(this, node, frame);
        }
        else {
            this.fail("compile: Cannot compile node: " + node.typename,
                      node.lineno,
                      node.colno);
        }
    },

    getCode: function() {
        return this.codebuf.join('');
    }
});

// var fs = require("fs");
//var src = '{{ foo({a:1}) }} {% block content %}foo{% endblock %}';
// var c = new Compiler();
// var src = '{{ foo | poop(1, 2, 3) }}';
//var extensions = [new testExtension()];

// var ns = parser.parse(src);
// nodes.printNodes(ns);
// c.compile(ns);

// var tmpl = c.getCode();
// console.log(tmpl);

module.exports = {
    compile: function(src, extensions, name) {
        var c = new Compiler(extensions);

        // Run the extension preprocessors against the source.
        if (extensions && extensions.length) {
            for (var i = 0; i < extensions.length; i++) {
                if ('preprocess' in extensions[i]) {
                    src = extensions[i].preprocess(src, name);
                }
            }
        }

        c.compile(parser.parse(src, extensions));
        return c.getCode();
    },

    Compiler: Compiler
};
