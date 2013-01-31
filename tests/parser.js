var should = require('should');
var lib = require('../src/lib');
var nodes = require('../src/nodes');
var parser = require('../src/parser');

function _isAST(node1, node2) {
    // Compare ASTs
    // TODO: Clean this up

    node1.typename.should.equal(node2.typename);

    var children1 = (node1.children && node1.children.length) || 'null';
    var children2 = (node2.children && node2.children.length) || 'null';

    if(node2 instanceof nodes.NodeList) {
        var lit = ': num-children: ';
        var sig2 = (node2.typename + lit + node2.children.length);

        should.exist(node1.children);
        var sig1 = (node1.typename + lit + node1.children.length);
        
        sig1.should.equal(sig2);

        for(var i=0, l=node2.children.length; i<l; i++) {
            _isAST(node1.children[i], node2.children[i]);
        }
    }
    else {
        node2.iterFields(function(value, field) {
            if(value instanceof nodes.Node) {
                _isAST(node1[field], value);
            }
            else if(node1[field] !== null || value !== null) {
                if(node1[field] === null) {
                    throw new Error(value + ' expected for "' + field + 
                                    '", null found');
                }

                if(value === null) {
                    throw new Error(node1[field] + ' expected to be null for "' +
                                    field + '"');
                }

                // We want good errors and tracebacks, so test on
                // whichever object exists
                if(!node1[field]) {
                    value.should.equal(node1[field]);
                }
                else {
                    node1[field].should.equal(value);
                }
            }
        });
    }
}

function isAST(node1, ast) {
    // Compare the ASTs, the second one is an AST literal so transform
    // it into a real one
    return _isAST(node1, toNodes(ast));
}

// We'll be doing a lot of AST comparisons, so this defines a kind
// of "AST literal" that you can specify with arrays. This
// transforms it into a real AST.
function toNodes(ast) {
    if(!(ast && lib.isArray(ast))) {
        return ast;
    }

    var type = ast[0];
    var dummy = Object.create(type.prototype);

    if(dummy instanceof nodes.NodeList) {
        return new type(0, 0, lib.map(ast.slice(1), toNodes));
    }
    else {
        return new type(0, 0,
                       toNodes(ast[1]),
                       toNodes(ast[2]),
                       toNodes(ast[3]),
                       toNodes(ast[4]),
                       toNodes(ast[5]));
    }
}

describe('parser', function() {
    it('should parse basic types', function() {
        isAST(parser.parse('{{ 1 }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 1]]]);

        isAST(parser.parse('{{ 4.567 }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 4.567]]]);

        isAST(parser.parse('{{ "foo" }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 'foo']]]);

        isAST(parser.parse("{{ 'foo' }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 'foo']]]);

        isAST(parser.parse("{{ true }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, true]]]);

        isAST(parser.parse("{{ false }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, false]]]);

        isAST(parser.parse("{{ foo }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Symbol, 'foo']]]);
    });

    it('should parse aggregate types', function() {
        isAST(parser.parse("{{ [1,2,3] }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Array,
                 [nodes.Literal, 1],
                 [nodes.Literal, 2],
                 [nodes.Literal, 3]]]]);

        isAST(parser.parse("{{ (1,2,3) }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Group,
                 [nodes.Literal, 1],
                 [nodes.Literal, 2],
                 [nodes.Literal, 3]]]]);

        isAST(parser.parse("{{ {foo: 1, 'two': 2} }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Dict,
                 [nodes.Pair,
                  [nodes.Symbol, 'foo'],
                  [nodes.Literal, 1]],
                 [nodes.Pair,
                  [nodes.Literal, 'two'],
                  [nodes.Literal, 2]]]]]);
    });

    it('should parse variables', function() {
        isAST(parser.parse('hello {{ foo }}, how are you'),
              [nodes.Root,
               [nodes.Output, [nodes.TemplateData, 'hello ']],
               [nodes.Output, [nodes.Symbol, 'foo']],
               [nodes.Output, [nodes.TemplateData, ', how are you']]]);
    });

    it('should parse blocks', function() {
        var n = parser.parse('want some {% if hungry %}pizza{% else %}' +
                             'water{% endif %}?');
        n.children[1].typename.should.equal('If');

        n = parser.parse('{% block foo %}stuff{% endblock %}');
        n.children[0].typename.should.equal('Block');

        n = parser.parse('{% extends "test.html" %}stuff');
        n.children[0].typename.should.equal('Extends');

        n = parser.parse('{% include "test.html" %}');
        n.children[0].typename.should.equal('Include');

    });

    it('should parse filters', function() {
        isAST(parser.parse('{{ foo | bar }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Filter,
                 [nodes.Symbol, 'bar'],
                 [nodes.NodeList,
                  [nodes.Symbol, 'foo']]]]]);

        isAST(parser.parse('{{ foo | bar | baz }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Filter,
                 [nodes.Symbol, 'baz'],
                 [nodes.NodeList,
                  [nodes.Filter,
                   [nodes.Symbol, 'bar'],
                   [nodes.NodeList,
                    [nodes.Symbol, 'foo']]]]]]]);

        isAST(parser.parse('{{ foo | bar(3) }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Filter,
                 [nodes.Symbol, 'bar'],
                 [nodes.NodeList,
                  [nodes.Symbol, 'foo'],
                  [nodes.Literal, 3]]]]]);
    });

    it('should parse macro definitions', function() {
        var ast = parser.parse('{% macro foo(bar, baz="foobar") %}' +
                               'This is a macro' +
                               '{% endmacro %}');
        isAST(ast,
              [nodes.Root,
               [nodes.Macro,
                [nodes.Symbol, 'foo'],
                [nodes.NodeList,
                 [nodes.Symbol, 'bar'],
                 [nodes.KeywordArgs,
                  [nodes.Pair, 
                   [nodes.Symbol, 'baz'], [nodes.Literal, 'foobar']]]],
                [nodes.NodeList,
                 [nodes.Output,
                  [nodes.TemplateData, 'This is a macro']]]]]);
    });

    it('should parse raw', function() {
        isAST(parser.parse('{% raw %}hello {{ {% %} }}{% endraw %}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.TemplateData, 'hello {{ {% %} }}']]]);
    });

    it('should parse keyword and non-keyword arguments', function() {
        isAST(parser.parse('{{ foo("bar", falalalala, baz="foobar") }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.FunCall,
                 [nodes.Symbol, 'foo'],
                 [nodes.NodeList,
                  [nodes.Literal, 'bar'],
                  [nodes.Symbol, 'falalalala'],
                  [nodes.KeywordArgs,
                   [nodes.Pair,
                    [nodes.Symbol, 'baz'],
                    [nodes.Literal, 'foobar']]]]]]]);
    });

    it('should parse imports', function() {
        isAST(parser.parse('{% import "foo/bar.html" as baz %}'),
              [nodes.Root,
               [nodes.Import,
                [nodes.Literal, 'foo/bar.html'],
                [nodes.Symbol, 'baz']]]);

        isAST(parser.parse('{% from "foo/bar.html" import baz, ' +
                           '   foobar as foobarbaz %}'),
              [nodes.Root,
               [nodes.FromImport,
                [nodes.Literal, "foo/bar.html"],
                [nodes.NodeList,
                 [nodes.Symbol, 'baz'],
                 [nodes.Pair,
                  [nodes.Symbol, 'foobar'],
                  [nodes.Symbol, 'foobarbaz']]]]]);
    });

    it('should parse whitespace control', function() {
        // Every start/end tag with "-" should trim the whitespace
        // before or after it

        isAST(parser.parse('{% if x %}\n  hi \n{% endif %}'),
              [nodes.Root,
               [nodes.If,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Output,
                  [nodes.TemplateData, '\n  hi \n']]]]]);

        isAST(parser.parse('{% if x -%}\n  hi \n{% endif %}'),
              [nodes.Root,
               [nodes.If,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Output,
                  [nodes.TemplateData, 'hi \n']]]]]);

        isAST(parser.parse('{% if x %}\n  hi \n{%- endif %}'),
              [nodes.Root,
               [nodes.If,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Output,
                  [nodes.TemplateData, '\n  hi']]]]]);

        isAST(parser.parse('{% if x -%}\n  hi \n{%- endif %}'),
              [nodes.Root,
               [nodes.If,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Output,
                  [nodes.TemplateData, 'hi']]]]]);

        isAST(parser.parse('poop  \n{%- if x -%}\n  hi \n{%- endif %}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.TemplateData, 'poop']],
               [nodes.If,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Output,
                  [nodes.TemplateData, 'hi']]]]]);

        // The from statement required a special case so make sure to
        // test it
        isAST(parser.parse('{% from x import y %}\n  hi \n'),
              [nodes.Root,
               [nodes.FromImport,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Symbol, 'y']]],
               [nodes.Output,
                [nodes.TemplateData, '\n  hi \n']]]);

        isAST(parser.parse('{% from x import y -%}\n  hi \n'),
              [nodes.Root,
               [nodes.FromImport,
                [nodes.Symbol, 'x'],
                [nodes.NodeList,
                 [nodes.Symbol, 'y']]],
               [nodes.Output,
                [nodes.TemplateData, 'hi \n']]]);
    });

    it('should throw errors', function() {
        (function() {
            parser.parse('hello {{ foo');
        }).should.throw(/expected variable end/);

        (function() {
            parser.parse('hello {% if');
        }).should.throw(/expected expression/);

        (function() {
            parser.parse('hello {% if sdf zxc');
        }).should.throw(/expected block end/);

        (function() {
            parser.parse('hello {% if sdf %} data');
        }).should.throw(/expected endif, else, or endif/);

        (function() {
            parser.parse('hello {% block sdf %} data');
        }).should.throw(/expected endblock/);

        (function() {
            parser.parse('hello {% bar %} dsfsdf');
        }).should.throw(/unknown block tag/);

        (function() {
            parser.parse('{{ foo(bar baz) }}');
        }).should.throw(/expected comma after expression/);

        (function() {
            parser.parse('{% import "foo" %}');
        }).should.throw(/expected "as" keyword/);

        (function() {
            parser.parse('{% from "foo" %}');
        }).should.throw(/expected import/);

        (function() {
            parser.parse('{% from "foo" import bar baz %}');
        }).should.throw(/expected comma/);

        (function() {
            parser.parse('{% from "foo" import _bar %}');
        }).should.throw(/names starting with an underscore cannot be imported/);
    });
});
