import {Obj} from './object';

function traverseAndCheck(obj, type, results) {
  if (obj instanceof type) {
    results.push(obj);
  }

  if (obj instanceof Node) {
    obj.findAll(type, results);
  }
}

export class Node extends Obj {
  init(lineno, colno, ...args) {
    this.lineno = lineno;
    this.colno = colno;

    this.fields.forEach((field, i) => {
      // The first two args are line/col numbers, so offset by 2
      var val = arguments[i + 2];

      // Fields should never be undefined, but null. It makes
      // testing easier to normalize values.
      if (val === undefined) {
        val = null;
      }

      this[field] = val;
    });
  }

  findAll(type, results) {
    results = results || [];

    if (this instanceof NodeList) {
      this.children.forEach(child => traverseAndCheck(child, type, results));
    } else {
      this.fields.forEach(field => traverseAndCheck(this[field], type, results));
    }

    return results;
  }

  iterFields(func) {
    this.fields.forEach((field) => {
      func(this[field], field);
    });
  }
}

// Abstract nodes
export class Value extends Node {
  get typename() { return 'Value'; }
  get fields() {
    return ['value'];
  }
}

// Concrete nodes
export class NodeList extends Node {
  get typename() { return 'NodeList'; }
  get fields() { return ['children']; }

  init(lineno, colno, nodes) {
    super.init(lineno, colno, nodes || []);
  }

  addChild(node) {
    this.children.push(node);
  }
}

export const Root = NodeList.extend('Root');
export const Literal = Value.extend('Literal');
export const Symbol = Value.extend('Symbol');
export const Group = NodeList.extend('Group');
const ArrayNode = NodeList.extend('Array');
export {ArrayNode as Array};
export const Pair = Node.extend('Pair', { fields: ['key', 'value'] });
export const Dict = NodeList.extend('Dict');
export const LookupVal = Node.extend('LookupVal', { fields: ['target', 'val'] });
export const If = Node.extend('If', { fields: ['cond', 'body', 'else_'] });
export const IfAsync = If.extend('IfAsync');
export const InlineIf = Node.extend('InlineIf', { fields: ['cond', 'body', 'else_'] });
export const For = Node.extend('For', { fields: ['arr', 'name', 'body', 'else_'] });
export const AsyncEach = For.extend('AsyncEach');
export const AsyncAll = For.extend('AsyncAll');
export const Macro = Node.extend('Macro', { fields: ['name', 'args', 'body'] });
export const Caller = Macro.extend('Caller');
export const Import = Node.extend('Import', { fields: ['template', 'target', 'withContext'] });

export class FromImport extends Node {
  get typename() { return 'FromImport'; }
  get fields() { return ['template', 'names', 'withContext']; }

  init(lineno, colno, template, names, withContext) {
    super.init(lineno, colno, template, names || new NodeList(), withContext);
  }
}

export const FunCall = Node.extend('FunCall', { fields: ['name', 'args'] });
export const Filter = FunCall.extend('Filter');
export const FilterAsync = Filter.extend('FilterAsync', { fields: ['name', 'args', 'symbol'] });
export const KeywordArgs = Dict.extend('KeywordArgs');
export const Block = Node.extend('Block', { fields: ['name', 'body'] });
export const Super = Node.extend('Super', { fields: ['blockName', 'symbol'] });
const TemplateRef = Node.extend('TemplateRef', { fields: ['template'] });
export const Extends = TemplateRef.extend('Extends');
export const Include = Node.extend('Include', { fields: ['template', 'ignoreMissing'] });
export const Set = Node.extend('Set', { fields: ['targets', 'value'] });
export const Switch = Node.extend('Switch', { fields: ['expr', 'cases', 'default'] });
export const Case = Node.extend('Case', { fields: ['cond', 'body'] });
export const Output = NodeList.extend('Output');
export const Capture = Node.extend('Capture', { fields: ['body'] });
export const TemplateData = Literal.extend('TemplateData');
const UnaryOp = Node.extend('UnaryOp', { fields: ['target'] });
export const BinOp = Node.extend('BinOp', { fields: ['left', 'right'] });
export const In = BinOp.extend('In');
export const Is = BinOp.extend('Is');
export const Or = BinOp.extend('Or');
export const And = BinOp.extend('And');
export const Not = UnaryOp.extend('Not');
export const Add = BinOp.extend('Add');
export const Concat = BinOp.extend('Concat');
export const Sub = BinOp.extend('Sub');
export const Mul = BinOp.extend('Mul');
export const Div = BinOp.extend('Div');
export const FloorDiv = BinOp.extend('FloorDiv');
export const Mod = BinOp.extend('Mod');
export const Pow = BinOp.extend('Pow');
export const Neg = UnaryOp.extend('Neg');
export const Pos = UnaryOp.extend('Pos');
export const Compare = Node.extend('Compare', { fields: ['expr', 'ops'] });
export const CompareOperand = Node.extend('CompareOperand', { fields: ['expr', 'type'] });
export const CallExtension = Node.extend('CallExtension', {
  init(ext, prop, args, contentArgs) {
    this.parent();
    this.extName = ext.__name || ext;
    this.prop = prop;
    this.args = args || new NodeList();
    this.contentArgs = contentArgs || [];
    this.autoescape = ext.autoescape;
  },
  fields: ['extName', 'prop', 'args', 'contentArgs']
});
export const CallExtensionAsync = CallExtension.extend('CallExtensionAsync');

// This is hacky, but this is just a debugging function anyway
function print(str, indent, inline) {
  var lines = str.split('\n');

  lines.forEach((line, i) => {
    if (line && ((inline && i > 0) || !inline)) {
      process.stdout.write((' ').repeat(indent));
    }
    const nl = (i === lines.length - 1) ? '' : '\n';
    process.stdout.write(`${line}${nl}`);
  });
}

// Print the AST in a nicely formatted tree format for debuggin
export function printNodes(node, indent) {
  indent = indent || 0;

  print(node.typename + ': ', indent);

  if (node instanceof NodeList) {
    print('\n');
    node.children.forEach((n) => {
      printNodes(n, indent + 2);
    });
  } else if (node instanceof CallExtension) {
    print(`${node.extName}.${node.prop}\n`);

    if (node.args) {
      printNodes(node.args, indent + 2);
    }

    if (node.contentArgs) {
      node.contentArgs.forEach((n) => {
        printNodes(n, indent + 2);
      });
    }
  } else {
    let nodes = [];
    let props = null;

    node.iterFields((val, fieldName) => {
      if (val instanceof Node) {
        nodes.push([fieldName, val]);
      } else {
        props = props || {};
        props[fieldName] = val;
      }
    });

    if (props) {
      print(JSON.stringify(props, null, 2) + '\n', null, true);
    } else {
      print('\n');
    }

    nodes.forEach(([fieldName, n]) => {
      print(`[${fieldName}] =>`, indent + 2);
      printNodes(n, indent + 4);
    });
  }
}
