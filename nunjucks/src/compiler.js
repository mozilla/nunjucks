'use strict';

const parser = require('./parser');
const transformer = require('./transformer');
const nodes = require('./nodes');
const {TemplateError} = require('./lib');
const {Frame} = require('./runtime');
const Obj = require('./object');

// These are all the same for now, but shouldn't be passed straight
// through
const compareOps = {
  '==': '==',
  '===': '===',
  '!=': '!=',
  '!==': '!==',
  '<': '<',
  '>': '>',
  '<=': '<=',
  '>=': '>='
};

class Compiler extends Obj {
  init(templateName, throwOnUndefined) {
    this.templateName = templateName;
    this.codebuf = [];
    this.lastId = 0;
    this.buffer = null;
    this.bufferStack = [];
    this.scopeClosers = '';
    this.inBlock = false;
    this.throwOnUndefined = throwOnUndefined;
  }

  fail(msg, lineno, colno) {
    if (lineno !== undefined) {
      lineno += 1;
    }
    if (colno !== undefined) {
      colno += 1;
    }

    throw new TemplateError(msg, lineno, colno);
  }

  pushBuffer() {
    const id = this.tmpid();
    this.bufferStack.push(this.buffer);
    this.buffer = id;
    this.emit(`var ${this.buffer} = "";`);
    return id;
  }

  popBuffer() {
    this.buffer = this.bufferStack.pop();
  }

  emit(code) {
    this.codebuf.push(code);
  }

  emitLine(code) {
    this.emit(code + '\n');
  }

  emitLines(...lines) {
    lines.forEach((line) => this.emitLine(line));
  }

  emitFuncBegin(name) {
    this.buffer = 'output';
    this.scopeClosers = '';
    this.emitLine('function ' + name + '(env, context, frame, runtime, cb) {');
    this.emitLine('var lineno = null;');
    this.emitLine('var colno = null;');
    this.emitLine('var ' + this.buffer + ' = "";');
    this.emitLine('try {');
  }

  emitFuncEnd(noReturn) {
    if (!noReturn) {
      this.emitLine('cb(null, ' + this.buffer + ');');
    }

    this.closeScopeLevels();
    this.emitLine('} catch (e) {');
    this.emitLine('  cb(runtime.handleError(e, lineno, colno));');
    this.emitLine('}');
    this.emitLine('}');
    this.buffer = null;
  }

  addScopeLevel() {
    this.scopeClosers += '})';
  }

  closeScopeLevels() {
    this.emitLine(this.scopeClosers + ';');
    this.scopeClosers = '';
  }

  withScopedSyntax(func) {
    var scopeClosers = this.scopeClosers;
    this.scopeClosers = '';

    func.call(this);

    this.closeScopeLevels();
    this.scopeClosers = scopeClosers;
  }

  makeCallback(res) {
    var err = this.tmpid();

    return 'function(' + err + (res ? ',' + res : '') + ') {\n' +
      'if(' + err + ') { cb(' + err + '); return; }';
  }

  tmpid() {
    this.lastId++;
    return 't_' + this.lastId;
  }

  _templateName() {
    return this.templateName == null ? 'undefined' : JSON.stringify(this.templateName);
  }

  _compileChildren(node, frame) {
    node.children.forEach((child) => {
      this.compile(child, frame);
    });
  }

  _compileAggregate(node, frame, startChar, endChar) {
    if (startChar) {
      this.emit(startChar);
    }

    node.children.forEach((child, i) => {
      if (i > 0) {
        this.emit(',');
      }

      this.compile(child, frame);
    });

    if (endChar) {
      this.emit(endChar);
    }
  }

  _compileExpression(node, frame) {
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
      nodes.Caller,
      nodes.Filter,
      nodes.LookupVal,
      nodes.Compare,
      nodes.InlineIf,
      nodes.In,
      nodes.And,
      nodes.Or,
      nodes.Not,
      nodes.Add,
      nodes.Concat,
      nodes.Sub,
      nodes.Mul,
      nodes.Div,
      nodes.FloorDiv,
      nodes.Mod,
      nodes.Pow,
      nodes.Neg,
      nodes.Pos,
      nodes.Compare,
      nodes.NodeList
    );
    this.compile(node, frame);
  }

  assertType(node, ...types) {
    if (!types.some(t => node instanceof t)) {
      this.fail(`assertType: invalid type: ${node.typename}`, node.lineno, node.colno);
    }
  }

  compileCallExtension(node, frame, async) {
    var args = node.args;
    var contentArgs = node.contentArgs;
    var autoescape = typeof node.autoescape === 'boolean' ? node.autoescape : true;

    if (!async) {
      this.emit(`${this.buffer} += runtime.suppressValue(`);
    }

    this.emit(`env.getExtension("${node.extName}")["${node.prop}"](`);
    this.emit('context');

    if (args || contentArgs) {
      this.emit(',');
    }

    if (args) {
      if (!(args instanceof nodes.NodeList)) {
        this.fail('compileCallExtension: arguments must be a NodeList, ' +
          'use `parser.parseSignature`');
      }

      args.children.forEach((arg, i) => {
        // Tag arguments are passed normally to the call. Note
        // that keyword arguments are turned into a single js
        // object as the last argument, if they exist.
        this._compileExpression(arg, frame);

        if (i !== args.children.length - 1 || contentArgs.length) {
          this.emit(',');
        }
      });
    }

    if (contentArgs.length) {
      contentArgs.forEach((arg, i) => {
        if (i > 0) {
          this.emit(',');
        }

        if (arg) {
          this.emitLine('function(cb) {');
          this.emitLine('if(!cb) { cb = function(err) { if(err) { throw err; }}}');
          const id = this.pushBuffer();

          this.withScopedSyntax(() => {
            this.compile(arg, frame);
            this.emitLine(`cb(null, ${id});`);
          });

          this.popBuffer();
          this.emitLine(`return ${id};`);
          this.emitLine('}');
        } else {
          this.emit('null');
        }
      });
    }

    if (async) {
      const res = this.tmpid();
      this.emitLine(', ' + this.makeCallback(res));
      this.emitLine(
        `${this.buffer} += runtime.suppressValue(${res}, ${autoescape} && env.opts.autoescape);`);
      this.addScopeLevel();
    } else {
      this.emit(')');
      this.emit(`, ${autoescape} && env.opts.autoescape);\n`);
    }
  }

  compileCallExtensionAsync(node, frame) {
    this.compileCallExtension(node, frame, true);
  }

  compileNodeList(node, frame) {
    this._compileChildren(node, frame);
  }

  compileLiteral(node) {
    if (typeof node.value === 'string') {
      let val = node.value.replace(/\\/g, '\\\\');
      val = val.replace(/"/g, '\\"');
      val = val.replace(/\n/g, '\\n');
      val = val.replace(/\r/g, '\\r');
      val = val.replace(/\t/g, '\\t');
      this.emit(`"${val}"`);
    } else if (node.value === null) {
      this.emit('null');
    } else {
      this.emit(node.value.toString());
    }
  }

  compileSymbol(node, frame) {
    var name = node.value;
    var v = frame.lookup(name);

    if (v) {
      this.emit(v);
    } else {
      this.emit('runtime.contextOrFrameLookup(' +
        'context, frame, "' + name + '")');
    }
  }

  compileGroup(node, frame) {
    this._compileAggregate(node, frame, '(', ')');
  }

  compileArray(node, frame) {
    this._compileAggregate(node, frame, '[', ']');
  }

  compileDict(node, frame) {
    this._compileAggregate(node, frame, '{', '}');
  }

  compilePair(node, frame) {
    var key = node.key;
    var val = node.value;

    if (key instanceof nodes.Symbol) {
      key = new nodes.Literal(key.lineno, key.colno, key.value);
    } else if (!(key instanceof nodes.Literal &&
      typeof key.value === 'string')) {
      this.fail('compilePair: Dict keys must be strings or names',
        key.lineno,
        key.colno);
    }

    this.compile(key, frame);
    this.emit(': ');
    this._compileExpression(val, frame);
  }

  compileInlineIf(node, frame) {
    this.emit('(');
    this.compile(node.cond, frame);
    this.emit('?');
    this.compile(node.body, frame);
    this.emit(':');
    if (node.else_ !== null) {
      this.compile(node.else_, frame);
    } else {
      this.emit('""');
    }
    this.emit(')');
  }

  compileIn(node, frame) {
    this.emit('runtime.inOperator(');
    this.compile(node.left, frame);
    this.emit(',');
    this.compile(node.right, frame);
    this.emit(')');
  }

  compileIs(node, frame) {
    // first, we need to try to get the name of the test function, if it's a
    // callable (i.e., has args) and not a symbol.
    var right = node.right.name
      ? node.right.name.value
      // otherwise go with the symbol value
      : node.right.value;
    this.emit('env.getTest("' + right + '").call(context, ');
    this.compile(node.left, frame);
    // compile the arguments for the callable if they exist
    if (node.right.args) {
      this.emit(',');
      this.compile(node.right.args, frame);
    }
    this.emit(') === true');
  }

  _binOpEmitter(node, frame, str) {
    this.compile(node.left, frame);
    this.emit(str);
    this.compile(node.right, frame);
  }

  // ensure concatenation instead of addition
  // by adding empty string in between
  compileOr(node, frame) {
    return this._binOpEmitter(node, frame, ' || ');
  }

  compileAnd(node, frame) {
    return this._binOpEmitter(node, frame, ' && ');
  }

  compileAdd(node, frame) {
    return this._binOpEmitter(node, frame, ' + ');
  }

  compileConcat(node, frame) {
    return this._binOpEmitter(node, frame, ' + "" + ');
  }

  compileSub(node, frame) {
    return this._binOpEmitter(node, frame, ' - ');
  }

  compileMul(node, frame) {
    return this._binOpEmitter(node, frame, ' * ');
  }

  compileDiv(node, frame) {
    return this._binOpEmitter(node, frame, ' / ');
  }

  compileMod(node, frame) {
    return this._binOpEmitter(node, frame, ' % ');
  }

  compileNot(node, frame) {
    this.emit('!');
    this.compile(node.target, frame);
  }

  compileFloorDiv(node, frame) {
    this.emit('Math.floor(');
    this.compile(node.left, frame);
    this.emit(' / ');
    this.compile(node.right, frame);
    this.emit(')');
  }

  compilePow(node, frame) {
    this.emit('Math.pow(');
    this.compile(node.left, frame);
    this.emit(', ');
    this.compile(node.right, frame);
    this.emit(')');
  }

  compileNeg(node, frame) {
    this.emit('-');
    this.compile(node.target, frame);
  }

  compilePos(node, frame) {
    this.emit('+');
    this.compile(node.target, frame);
  }

  compileCompare(node, frame) {
    this.compile(node.expr, frame);

    node.ops.forEach((op) => {
      this.emit(` ${compareOps[op.type]} `);
      this.compile(op.expr, frame);
    });
  }

  compileLookupVal(node, frame) {
    this.emit('runtime.memberLookup((');
    this._compileExpression(node.target, frame);
    this.emit('),');
    this._compileExpression(node.val, frame);
    this.emit(')');
  }

  _getNodeName(node) {
    switch (node.typename) {
      case 'Symbol':
        return node.value;
      case 'FunCall':
        return 'the return value of (' + this._getNodeName(node.name) + ')';
      case 'LookupVal':
        return this._getNodeName(node.target) + '["' +
          this._getNodeName(node.val) + '"]';
      case 'Literal':
        return node.value.toString();
      default:
        return '--expression--';
    }
  }

  compileFunCall(node, frame) {
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
    this.emit(', "' + this._getNodeName(node.name).replace(/"/g, '\\"') + '", context, ');

    this._compileAggregate(node.args, frame, '[', '])');

    this.emit(')');
  }

  compileFilter(node, frame) {
    var name = node.name;
    this.assertType(name, nodes.Symbol);
    this.emit('env.getFilter("' + name.value + '").call(context, ');
    this._compileAggregate(node.args, frame);
    this.emit(')');
  }

  compileFilterAsync(node, frame) {
    var name = node.name;
    var symbol = node.symbol.value;

    this.assertType(name, nodes.Symbol);

    frame.set(symbol, symbol);

    this.emit('env.getFilter("' + name.value + '").call(context, ');
    this._compileAggregate(node.args, frame);
    this.emitLine(', ' + this.makeCallback(symbol));

    this.addScopeLevel();
  }

  compileKeywordArgs(node, frame) {
    this.emit('runtime.makeKeywordArgs(');
    this.compileDict(node, frame);
    this.emit(')');
  }

  compileSet(node, frame) {
    var ids = [];

    // Lookup the variable names for each identifier and create
    // new ones if necessary
    node.targets.forEach((target) => {
      var name = target.value;
      var id = frame.lookup(name);

      if (id === null || id === undefined) {
        id = this.tmpid();

        // Note: This relies on js allowing scope across
        // blocks, in case this is created inside an `if`
        this.emitLine('var ' + id + ';');
      }

      ids.push(id);
    });

    if (node.value) {
      this.emit(ids.join(' = ') + ' = ');
      this._compileExpression(node.value, frame);
      this.emitLine(';');
    } else {
      this.emit(ids.join(' = ') + ' = ');
      this.compile(node.body, frame);
      this.emitLine(';');
    }

    node.targets.forEach((target, i) => {
      var id = ids[i];
      var name = target.value;

      // We are running this for every var, but it's very
      // uncommon to assign to multiple vars anyway
      this.emitLine(`frame.set("${name}", ${id}, true);`);

      this.emitLine('if(frame.topLevel) {');
      this.emitLine(`context.setVariable("${name}", ${id});`);
      this.emitLine('}');

      if (name.charAt(0) !== '_') {
        this.emitLine('if(frame.topLevel) {');
        this.emitLine(`context.addExport("${name}", ${id});`);
        this.emitLine('}');
      }
    });
  }

  compileSwitch(node, frame) {
    this.emit('switch (');
    this.compile(node.expr, frame);
    this.emit(') {');
    node.cases.forEach((c, i) => {
      this.emit('case ');
      this.compile(c.cond, frame);
      this.emit(': ');
      this.compile(c.body, frame);
      // preserve fall-throughs
      if (c.body.children.length) {
        this.emitLine('break;');
      }
    });
    if (node.default) {
      this.emit('default:');
      this.compile(node.default, frame);
    }
    this.emit('}');
  }

  compileIf(node, frame, async) {
    this.emit('if(');
    this._compileExpression(node.cond, frame);
    this.emitLine(') {');

    this.withScopedSyntax(() => {
      this.compile(node.body, frame);

      if (async) {
        this.emit('cb()');
      }
    });

    if (node.else_) {
      this.emitLine('}\nelse {');

      this.withScopedSyntax(() => {
        this.compile(node.else_, frame);

        if (async) {
          this.emit('cb()');
        }
      });
    } else if (async) {
      this.emitLine('}\nelse {');
      this.emit('cb()');
    }

    this.emitLine('}');
  }

  compileIfAsync(node, frame) {
    this.emit('(function(cb) {');
    this.compileIf(node, frame, true);
    this.emit('})(' + this.makeCallback());
    this.addScopeLevel();
  }

  emitLoopBindings(node, arr, i, len) {
    const bindings = [
      {name: 'index', val: `${i} + 1`},
      {name: 'index0', val: i},
      {name: 'revindex', val: `${len} - ${i}`},
      {name: 'revindex0', val: `${len} - ${i} - 1`},
      {name: 'first', val: `${i} === 0`},
      {name: 'last', val: `${i} === ${len} - 1`},
      {name: 'length', val: len},
    ];

    bindings.forEach((b) => {
      this.emitLine(`frame.set("loop.${b.name}", ${b.val});`);
    });
  }

  compileFor(node, frame) {
    // Some of this code is ugly, but it keeps the generated code
    // as fast as possible. ForAsync also shares some of this, but
    // not much.

    const i = this.tmpid();
    const len = this.tmpid();
    const arr = this.tmpid();
    frame = frame.push();

    this.emitLine('frame = frame.push();');

    this.emit(`var ${arr} = `);
    this._compileExpression(node.arr, frame);
    this.emitLine(';');

    this.emit(`if(${arr}) {`);
    this.emitLine(arr + ' = runtime.fromIterator(' + arr + ');');

    // If multiple names are passed, we need to bind them
    // appropriately
    if (node.name instanceof nodes.Array) {
      this.emitLine(`var ${i};`);

      // The object could be an arroy or object. Note that the
      // body of the loop is duplicated for each condition, but
      // we are optimizing for speed over size.
      this.emitLine(`if(runtime.isArray(${arr})) {`);
      this.emitLine(`var ${len} = ${arr}.length;`);
      this.emitLine(`for(${i}=0; ${i} < ${arr}.length; ${i}++) {`);

      // Bind each declared var
      node.name.children.forEach((child, u) => {
        var tid = this.tmpid();
        this.emitLine(`var ${tid} = ${arr}[${i}][${u}];`);
        this.emitLine(`frame.set("${child}", ${arr}[${i}][${u}]);`);
        frame.set(node.name.children[u].value, tid);
      });

      this.emitLoopBindings(node, arr, i, len);
      this.withScopedSyntax(() => {
        this.compile(node.body, frame);
      });
      this.emitLine('}');

      this.emitLine('} else {');
      // Iterate over the key/values of an object
      const [key, val] = node.name.children;
      const k = this.tmpid();
      const v = this.tmpid();
      frame.set(key.value, k);
      frame.set(val.value, v);

      this.emitLine(`${i} = -1;`);
      this.emitLine(`var ${len} = runtime.keys(${arr}).length;`);
      this.emitLine(`for(var ${k} in ${arr}) {`);
      this.emitLine(`${i}++;`);
      this.emitLine(`var ${v} = ${arr}[${k}];`);
      this.emitLine(`frame.set("${key.value}", ${k});`);
      this.emitLine(`frame.set("${val.value}", ${v});`);

      this.emitLoopBindings(node, arr, i, len);
      this.withScopedSyntax(() => {
        this.compile(node.body, frame);
      });
      this.emitLine('}');

      this.emitLine('}');
    } else {
      // Generate a typical array iteration
      const v = this.tmpid();
      frame.set(node.name.value, v);

      this.emitLine(`var ${len} = ${arr}.length;`);
      this.emitLine(`for(var ${i}=0; ${i} < ${arr}.length; ${i}++) {`);
      this.emitLine(`var ${v} = ${arr}[${i}];`);
      this.emitLine(`frame.set("${node.name.value}", ${v});`);

      this.emitLoopBindings(node, arr, i, len);

      this.withScopedSyntax(() => {
        this.compile(node.body, frame);
      });

      this.emitLine('}');
    }

    this.emitLine('}');
    if (node.else_) {
      this.emitLine('if (!' + len + ') {');
      this.compile(node.else_, frame);
      this.emitLine('}');
    }

    this.emitLine('frame = frame.pop();');
  }

  _compileAsyncLoop(node, frame, parallel) {
    // This shares some code with the For tag, but not enough to
    // worry about. This iterates across an object asynchronously,
    // but not in parallel.

    var i = this.tmpid();
    var len = this.tmpid();
    var arr = this.tmpid();
    var asyncMethod = parallel ? 'asyncAll' : 'asyncEach';
    frame = frame.push();

    this.emitLine('frame = frame.push();');

    this.emit('var ' + arr + ' = runtime.fromIterator(');
    this._compileExpression(node.arr, frame);
    this.emitLine(');');

    if (node.name instanceof nodes.Array) {
      const arrayLen = node.name.children.length;
      this.emit(`runtime.${asyncMethod}(${arr}, ${arrayLen}, function(`);

      node.name.children.forEach((name) => {
        this.emit(`${name.value},`);
      });

      this.emit(i + ',' + len + ',next) {');

      node.name.children.forEach((name) => {
        const id = name.value;
        frame.set(id, id);
        this.emitLine(`frame.set("${id}", ${id});`);
      });
    } else {
      const id = node.name.value;
      this.emitLine(`runtime.${asyncMethod}(${arr}, 1, function(${id}, ${i}, ${len},next) {`);
      this.emitLine('frame.set("' + id + '", ' + id + ');');
      frame.set(id, id);
    }

    this.emitLoopBindings(node, arr, i, len);

    this.withScopedSyntax(() => {
      let buf;
      if (parallel) {
        buf = this.pushBuffer();
      }

      this.compile(node.body, frame);
      this.emitLine('next(' + i + (buf ? ',' + buf : '') + ');');

      if (parallel) {
        this.popBuffer();
      }
    });

    const output = this.tmpid();
    this.emitLine('}, ' + this.makeCallback(output));
    this.addScopeLevel();

    if (parallel) {
      this.emitLine(this.buffer + ' += ' + output + ';');
    }

    if (node.else_) {
      this.emitLine('if (!' + arr + '.length) {');
      this.compile(node.else_, frame);
      this.emitLine('}');
    }

    this.emitLine('frame = frame.pop();');
  }

  compileAsyncEach(node, frame) {
    this._compileAsyncLoop(node, frame);
  }

  compileAsyncAll(node, frame) {
    this._compileAsyncLoop(node, frame, true);
  }

  _compileMacro(node, frame) {
    var args = [];
    var kwargs = null;
    var funcId = 'macro_' + this.tmpid();
    var keepFrame = (frame !== undefined);

    // Type check the definition of the args
    node.args.children.forEach((arg, i) => {
      if (i === node.args.children.length - 1 && arg instanceof nodes.Dict) {
        kwargs = arg;
      } else {
        this.assertType(arg, nodes.Symbol);
        args.push(arg);
      }
    });

    const realNames = [...args.map((n) => `l_${n.value}`), 'kwargs'];

    // Quoted argument names
    const argNames = args.map((n) => `"${n.value}"`);
    const kwargNames = ((kwargs && kwargs.children) || []).map((n) => `"${n.key.value}"`);

    // We pass a function to makeMacro which destructures the
    // arguments so support setting positional args with keywords
    // args and passing keyword args as positional args
    // (essentially default values). See runtime.js.
    let currFrame;
    if (keepFrame) {
      currFrame = frame.push(true);
    } else {
      currFrame = new Frame();
    }
    this.emitLines(
      `var ${funcId} = runtime.makeMacro(`,
      `[${argNames.join(', ')}], `,
      `[${kwargNames.join(', ')}], `,
      `function (${realNames.join(', ')}) {`,
      'var callerFrame = frame;',
      'frame = ' + ((keepFrame) ? 'frame.push(true);' : 'new runtime.Frame();'),
      'kwargs = kwargs || {};',
      'if (Object.prototype.hasOwnProperty.call(kwargs, "caller")) {',
      'frame.set("caller", kwargs.caller); }');

    // Expose the arguments to the template. Don't need to use
    // random names because the function
    // will create a new run-time scope for us
    args.forEach((arg) => {
      this.emitLine(`frame.set("${arg.value}", l_${arg.value});`);
      currFrame.set(arg.value, `l_${arg.value}`);
    });

    // Expose the keyword arguments
    if (kwargs) {
      kwargs.children.forEach((pair) => {
        const name = pair.key.value;
        this.emit(`frame.set("${name}", `);
        this.emit(`Object.prototype.hasOwnProperty.call(kwargs, "${name}")`);
        this.emit(` ? kwargs["${name}"] : `);
        this._compileExpression(pair.value, currFrame);
        this.emit(');');
      });
    }

    const bufferId = this.pushBuffer();

    this.withScopedSyntax(() => {
      this.compile(node.body, currFrame);
    });

    this.emitLine('frame = ' + ((keepFrame) ? 'frame.pop();' : 'callerFrame;'));
    this.emitLine(`return new runtime.SafeString(${bufferId});`);
    this.emitLine('});');
    this.popBuffer();

    return funcId;
  }

  compileMacro(node, frame) {
    var funcId = this._compileMacro(node);

    // Expose the macro to the templates
    var name = node.name.value;
    frame.set(name, funcId);

    if (frame.parent) {
      this.emitLine(`frame.set("${name}", ${funcId});`);
    } else {
      if (node.name.value.charAt(0) !== '_') {
        this.emitLine(`context.addExport("${name}");`);
      }
      this.emitLine(`context.setVariable("${name}", ${funcId});`);
    }
  }

  compileCaller(node, frame) {
    // basically an anonymous "macro expression"
    this.emit('(function (){');
    const funcId = this._compileMacro(node, frame);
    this.emit(`return ${funcId};})()`);
  }

  _compileGetTemplate(node, frame, eagerCompile, ignoreMissing) {
    const parentTemplateId = this.tmpid();
    const parentName = this._templateName();
    const cb = this.makeCallback(parentTemplateId);
    const eagerCompileArg = (eagerCompile) ? 'true' : 'false';
    const ignoreMissingArg = (ignoreMissing) ? 'true' : 'false';
    this.emit('env.getTemplate(');
    this._compileExpression(node.template, frame);
    this.emitLine(`, ${eagerCompileArg}, ${parentName}, ${ignoreMissingArg}, ${cb}`);
    return parentTemplateId;
  }

  compileImport(node, frame) {
    const target = node.target.value;
    const id = this._compileGetTemplate(node, frame, false, false);
    this.addScopeLevel();

    this.emitLine(id + '.getExported(' +
      (node.withContext ? 'context.getVariables(), frame, ' : '') +
      this.makeCallback(id));
    this.addScopeLevel();

    frame.set(target, id);

    if (frame.parent) {
      this.emitLine(`frame.set("${target}", ${id});`);
    } else {
      this.emitLine(`context.setVariable("${target}", ${id});`);
    }
  }

  compileFromImport(node, frame) {
    const importedId = this._compileGetTemplate(node, frame, false, false);
    this.addScopeLevel();

    this.emitLine(importedId + '.getExported(' +
      (node.withContext ? 'context.getVariables(), frame, ' : '') +
      this.makeCallback(importedId));
    this.addScopeLevel();

    node.names.children.forEach((nameNode) => {
      var name;
      var alias;
      var id = this.tmpid();

      if (nameNode instanceof nodes.Pair) {
        name = nameNode.key.value;
        alias = nameNode.value.value;
      } else {
        name = nameNode.value;
        alias = name;
      }

      this.emitLine(`if(Object.prototype.hasOwnProperty.call(${importedId}, "${name}")) {`);
      this.emitLine(`var ${id} = ${importedId}.${name};`);
      this.emitLine('} else {');
      this.emitLine(`cb(new Error("cannot import '${name}'")); return;`);
      this.emitLine('}');

      frame.set(alias, id);

      if (frame.parent) {
        this.emitLine(`frame.set("${alias}", ${id});`);
      } else {
        this.emitLine(`context.setVariable("${alias}", ${id});`);
      }
    });
  }

  compileBlock(node) {
    var id = this.tmpid();

    // If we are executing outside a block (creating a top-level
    // block), we really don't want to execute its code because it
    // will execute twice: once when the child template runs and
    // again when the parent template runs. Note that blocks
    // within blocks will *always* execute immediately *and*
    // wherever else they are invoked (like used in a parent
    // template). This may have behavioral differences from jinja
    // because blocks can have side effects, but it seems like a
    // waste of performance to always execute huge top-level
    // blocks twice
    if (!this.inBlock) {
      this.emit('(parentTemplate ? function(e, c, f, r, cb) { cb(""); } : ');
    }
    this.emit(`context.getBlock("${node.name.value}")`);
    if (!this.inBlock) {
      this.emit(')');
    }
    this.emitLine('(env, context, frame, runtime, ' + this.makeCallback(id));
    this.emitLine(`${this.buffer} += ${id};`);
    this.addScopeLevel();
  }

  compileSuper(node, frame) {
    var name = node.blockName.value;
    var id = node.symbol.value;

    const cb = this.makeCallback(id);
    this.emitLine(`context.getSuper(env, "${name}", b_${name}, frame, runtime, ${cb}`);
    this.emitLine(`${id} = runtime.markSafe(${id});`);
    this.addScopeLevel();
    frame.set(id, id);
  }

  compileExtends(node, frame) {
    var k = this.tmpid();

    const parentTemplateId = this._compileGetTemplate(node, frame, true, false);

    // extends is a dynamic tag and can occur within a block like
    // `if`, so if this happens we need to capture the parent
    // template in the top-level scope
    this.emitLine(`parentTemplate = ${parentTemplateId}`);

    this.emitLine(`for(var ${k} in parentTemplate.blocks) {`);
    this.emitLine(`context.addBlock(${k}, parentTemplate.blocks[${k}]);`);
    this.emitLine('}');

    this.addScopeLevel();
  }

  compileInclude(node, frame) {
    this.emitLine('var tasks = [];');
    this.emitLine('tasks.push(');
    this.emitLine('function(callback) {');
    const id = this._compileGetTemplate(node, frame, false, node.ignoreMissing);
    this.emitLine(`callback(null,${id});});`);
    this.emitLine('});');

    const id2 = this.tmpid();
    this.emitLine('tasks.push(');
    this.emitLine('function(template, callback){');
    this.emitLine('template.render(context.getVariables(), frame, ' + this.makeCallback(id2));
    this.emitLine('callback(null,' + id2 + ');});');
    this.emitLine('});');

    this.emitLine('tasks.push(');
    this.emitLine('function(result, callback){');
    this.emitLine(`${this.buffer} += result;`);
    this.emitLine('callback(null);');
    this.emitLine('});');
    this.emitLine('env.waterfall(tasks, function(){');
    this.addScopeLevel();
  }

  compileTemplateData(node, frame) {
    this.compileLiteral(node, frame);
  }

  compileCapture(node, frame) {
    // we need to temporarily override the current buffer id as 'output'
    // so the set block writes to the capture output instead of the buffer
    var buffer = this.buffer;
    this.buffer = 'output';
    this.emitLine('(function() {');
    this.emitLine('var output = "";');
    this.withScopedSyntax(() => {
      this.compile(node.body, frame);
    });
    this.emitLine('return output;');
    this.emitLine('})()');
    // and of course, revert back to the old buffer id
    this.buffer = buffer;
  }

  compileOutput(node, frame) {
    const children = node.children;
    children.forEach(child => {
      // TemplateData is a special case because it is never
      // autoescaped, so simply output it for optimization
      if (child instanceof nodes.TemplateData) {
        if (child.value) {
          this.emit(`${this.buffer} += `);
          this.compileLiteral(child, frame);
          this.emitLine(';');
        }
      } else {
        this.emit(`${this.buffer} += runtime.suppressValue(`);
        if (this.throwOnUndefined) {
          this.emit('runtime.ensureDefined(');
        }
        this.compile(child, frame);
        if (this.throwOnUndefined) {
          this.emit(`,${node.lineno},${node.colno})`);
        }
        this.emit(', env.opts.autoescape);\n');
      }
    });
  }

  compileRoot(node, frame) {
    if (frame) {
      this.fail('compileRoot: root node can\'t have frame');
    }

    frame = new Frame();

    this.emitFuncBegin('root');
    this.emitLine('var parentTemplate = null;');
    this._compileChildren(node, frame);
    this.emitLine('if(parentTemplate) {');
    this.emitLine('parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);');
    this.emitLine('} else {');
    this.emitLine(`cb(null, ${this.buffer});`);
    this.emitLine('}');
    this.emitFuncEnd(true);

    this.inBlock = true;

    const blockNames = [];

    const blocks = node.findAll(nodes.Block);

    blocks.forEach((block, i) => {
      const name = block.name.value;

      if (blockNames.indexOf(name) !== -1) {
        throw new Error(`Block "${name}" defined more than once.`);
      }
      blockNames.push(name);

      this.emitFuncBegin(`b_${name}`);

      const tmpFrame = new Frame();
      this.emitLine('var frame = frame.push(true);');
      this.compile(block.body, tmpFrame);
      this.emitFuncEnd();
    });

    this.emitLine('return {');

    blocks.forEach((block, i) => {
      const blockName = `b_${block.name.value}`;
      this.emitLine(`${blockName}: ${blockName},`);
    });

    this.emitLine('root: root\n};');
  }

  compile(node, frame) {
    var _compile = this['compile' + node.typename];
    if (_compile) {
      _compile.call(this, node, frame);
    } else {
      this.fail(`compile: Cannot compile node: ${node.typename}`, node.lineno, node.colno);
    }
  }

  getCode() {
    return this.codebuf.join('');
  }
}

module.exports = {
  compile: function compile(src, asyncFilters, extensions, name, opts = {}) {
    const c = new Compiler(name, opts.throwOnUndefined);

    // Run the extension preprocessors against the source.
    const preprocessors = (extensions || []).map(ext => ext.preprocess).filter(f => !!f);

    const processedSrc = preprocessors.reduce((s, processor) => processor(s), src);

    c.compile(transformer.transform(
      parser.parse(processedSrc, extensions, opts),
      asyncFilters,
      name
    ));
    return c.getCode();
  },

  Compiler: Compiler
};
