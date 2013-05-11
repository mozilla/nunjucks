(function() {
    var expect, lib, nodes, parser;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        lib = require('../src/lib');
        nodes = require('../src/nodes');
        parser = require('../src/parser');
    }
    else {
        expect = window.expect;
        lib = nunjucks.require('lib');
        nodes = nunjucks.require('nodes');
        parser = nunjucks.require('parser');
    }
    
    function _isAST(node1, node2) {
        // Compare ASTs
        // TODO: Clean this up (seriously, really)

        expect(node1.typename).to.be(node2.typename);

        var children1 = (node1.children && node1.children.length) || 'null';
        var children2 = (node2.children && node2.children.length) || 'null';

        if(node2 instanceof nodes.NodeList) {
            var lit = ': num-children: ';
            var sig2 = (node2.typename + lit + node2.children.length);

            expect(node1.children).to.be.ok();
            var sig1 = (node1.typename + lit + node1.children.length);

            expect(sig1).to.be(sig2);

            for(var i=0, l=node2.children.length; i<l; i++) {
                _isAST(node1.children[i], node2.children[i]);
            }
        }
        else {
            node2.iterFields(function(value, field) {
                var ofield = node1[field];

                if(value instanceof nodes.Node) {
                    _isAST(ofield, value);
                }
                else if(lib.isArray(ofield) && lib.isArray(value)) {
                    expect('num-children: ' + ofield.length).to.be('num-children: ' + value.length);

                    lib.each(ofield, function(v, i) {
                        if(ofield[i] instanceof nodes.Node) {
                            _isAST(ofield[i], value[i]);
                        }
                        else if(ofield[i] !== null && value[i] !== null) {
                            expect(ofield[i]).to.be(value[i]);
                        }
                    });
                }
                else if((ofield !== null || value !== null) &&
                        (ofield !== undefined || value !== undefined)) {
                    if(ofield === null) {
                        throw new Error(value + ' expected for "' + field +
                                        '", null found');
                    }

                    if(value === null) {
                        throw new Error(ofield + ' expected to be null for "' +
                                        field + '"');
                    }

                    // We want good errors and tracebacks, so test on
                    // whichever object exists
                    if(!ofield) {
                        expect(value).to.be(ofield);
                    }
                    else {
                        expect(ofield).to.be(value);
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
        else if(dummy instanceof nodes.CallExtension) {
            return new type(ast[1], ast[2], ast[3] ? toNodes(ast[3]) : ast[3],
                            lib.isArray(ast[4]) ? lib.map(ast[4], toNodes) : ast[4]);
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
            expect(n.children[1].typename).to.be('If');

            n = parser.parse('{% block foo %}stuff{% endblock %}');
            expect(n.children[0].typename).to.be('Block');

            n = parser.parse('{% extends "test.html" %}stuff');
            expect(n.children[0].typename).to.be('Extends');

            n = parser.parse('{% include "test.html" %}');
            expect(n.children[0].typename).to.be('Include');
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
            expect(function() {
                parser.parse('hello {{ foo');
            }).to.throwException(/expected variable end/);

            expect(function() {
                parser.parse('hello {% if');
            }).to.throwException(/expected expression/);

            expect(function() {
                parser.parse('hello {% if sdf zxc');
            }).to.throwException(/expected block end/);

            expect(function() {
                parser.parse('hello {% if sdf %} data');
            }).to.throwException(/expected endif, else, or endif/);

            expect(function() {
                parser.parse('hello {% block sdf %} data');
            }).to.throwException(/expected endblock/);

            expect(function() {
                parser.parse('hello {% bar %} dsfsdf');
            }).to.throwException(/unknown block tag/);

            expect(function() {
                parser.parse('{{ foo(bar baz) }}');
            }).to.throwException(/expected comma after expression/);

            expect(function() {
                parser.parse('{% import "foo" %}');
            }).to.throwException(/expected "as" keyword/);

            expect(function() {
                parser.parse('{% from "foo" %}');
            }).to.throwException(/expected import/);

            expect(function() {
                parser.parse('{% from "foo" import bar baz %}');
            }).to.throwException(/expected comma/);

            expect(function() {
                parser.parse('{% from "foo" import _bar %}');
            }).to.throwException(/names starting with an underscore cannot be imported/);
        });
        
        it('should parse custom tags', function() {

            function testtagExtension() {
                this.tags = ['testtag'];

                /* normally this is automatically done by Environment */
                this._name = 'testtagExtension';

                this.parse = function(parser, nodes) {
                    var begun = parser.peekToken();
                    parser.advanceAfterBlockEnd();
                    return new nodes.CallExtension(this, 'foo');
                };
            }

            function testblocktagExtension() {
                this.tags = ['testblocktag'];
                this._name = 'testblocktagExtension';

                this.parse = function(parser, nodes) {
                    var begun = parser.peekToken();
                    parser.advanceAfterBlockEnd();

                    var content = parser.parseUntilBlocks('endtestblocktag');
                    var tag = new nodes.CallExtension(this, 'bar', null, [1, content]);
                    parser.advanceAfterBlockEnd();

                    return tag;
                };
            }

            function testargsExtension() {
                this.tags = ['testargs'];
                this._name = 'testargsExtension';

                this.parse = function(parser, nodes, tokens) {
                    var begun = parser.peekToken();
                    var args = null;

                    // Skip the name
                    parser.nextToken(); 

                    args = parser.parseSignature(true);
                    parser.advanceAfterBlockEnd(begun.value);

                    return new nodes.CallExtension(this, 'biz', args);
                };
            }

            var extensions = [new testtagExtension(),
                              new testblocktagExtension(),
                              new testargsExtension()];
            
            isAST(parser.parse('{% testtag %}', extensions),
                  [nodes.Root,
                   [nodes.CallExtension, extensions[0], 'foo', undefined, undefined]]);

            isAST(parser.parse('{% testblocktag %}sdfd{% endtestblocktag %}',
                               extensions),
                  [nodes.Root,
                   [nodes.CallExtension, extensions[1], 'bar', null,
                    [1, [nodes.NodeList,
                         [nodes.Output,
                          [nodes.TemplateData, "sdfd"]]]]]]);

            isAST(parser.parse('{% testblocktag %}{{ 123 }}{% endtestblocktag %}',
                               extensions),
                  [nodes.Root,
                   [nodes.CallExtension, extensions[1], 'bar', null,
                    [1, [nodes.NodeList,
                         [nodes.Output,
                          [nodes.Literal, 123]]]]]]);

            isAST(parser.parse('{% testargs(123, "abc", foo="bar") %}', extensions),
                  [nodes.Root,
                   [nodes.CallExtension, extensions[2], 'biz',

                    // The only arg is the list of run-time arguments
                    // coming from the template
                    [nodes.NodeList,
                     [nodes.Literal, 123],
                     [nodes.Literal, "abc"],
                     [nodes.KeywordArgs, 
                      [nodes.Pair,
                       [nodes.Symbol, "foo"],
                       [nodes.Literal, "bar"]]]]]]);

            isAST(parser.parse('{% testargs %}', extensions),
                  [nodes.Root,
                   [nodes.CallExtension, extensions[2], 'biz', null]]);
        });
    });
})();
