(function() {
  'use strict';

  var expect;
  var util;
  var Template;
  var Loader;
  var Environment;
  var fs;
  var render;
  var equal;
  var finish;
  var isSlim;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
    Template = require('../nunjucks/src/environment').Template;
    Environment = require('../nunjucks/src/environment').Environment;
    fs = require('fs');
  } else {
    expect = window.expect;
    util = window.util;
    Template = nunjucks.Template;
    Environment = nunjucks.Environment;
  }

  render = util.render;
  equal = util.equal;
  finish = util.finish;
  isSlim = util.isSlim;
  Loader = util.Loader;

  describe('compiler', function() {
    it('should compile templates', function(done) {
      equal('Hello world', 'Hello world');
      equal('Hello world, {{ name }}',
        {
          name: 'James'
        },
        'Hello world, James');

      equal('Hello world, {{name}}{{suffix}}, how are you',
        {
          name: 'James',
          suffix: ' Long'
        },
        'Hello world, James Long, how are you');

      finish(done);
    });

    it('should escape newlines', function(done) {
      equal('foo\\nbar', 'foo\\nbar');
      finish(done);
    });

    it('should compile references', function(done) {
      equal('{{ foo.bar }}',
        {
          foo: {
            bar: 'baz'
          }
        },
        'baz');

      equal('{{ foo["bar"] }}',
        {
          foo: {
            bar: 'baz'
          }
        },
        'baz');

      finish(done);
    });

    it('should compile references - object without prototype', function(done) {
      var context = Object.create(null);
      context.foo = Object.create(null);
      context.foo.bar = 'baz';

      equal('{{ foo.bar }}',
        context,
        'baz');

      equal('{{ foo["bar"] }}',
        context,
        'baz');

      finish(done);
    });

    it('should fail silently on undefined values', function(done) {
      equal('{{ foo }}', '');
      equal('{{ foo.bar }}', '');
      equal('{{ foo.bar.baz }}', '');
      equal('{{ foo.bar.baz["biz"].mumble }}', '');
      finish(done);
    });

    it('should not treat falsy values the same as undefined', function(done) {
      equal('{{ foo }}', {
        foo: 0
      }, '0');
      equal('{{ foo }}', {
        foo: false
      }, 'false');
      finish(done);
    });

    it('should display none as empty string', function(done) {
      equal('{{ none }}', '');
      finish(done);
    });

    it('should compile none as falsy', function(done) {
      equal('{% if not none %}yes{% endif %}', 'yes');
      finish(done);
    });

    it('should compile none as null, not undefined', function(done) {
      equal('{{ none|default("d", false) }}', '');
      finish(done);
    });

    it('should compile function calls', function(done) {
      equal('{{ foo("msg") }}',
        {
          foo: function(str) {
            return str + 'hi';
          }
        },
        'msghi');
      finish(done);
    });

    it('should compile function calls with correct scope', function(done) {
      equal('{{ foo.bar() }}', {
        foo: {
          bar: function() {
            return this.baz;
          },
          baz: 'hello'
        }
      }, 'hello');

      finish(done);
    });

    it('should compile switch statements', function() {
      // standard switches
      var tpl1 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% default %}NEITHER FOO NOR BAR{% endswitch %}';
      // test no-default switches
      var tpl2 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% endswitch %}';
      // test fall-through cases
      var tpl3 = '{% switch foo %}{% case "bar" %}{% case "baz" %}BAR{% endswitch %}';
      equal(tpl1, 'NEITHER FOO NOR BAR');
      equal(tpl1, {
        foo: 'bar'
      }, 'BAR');
      equal(tpl1, {
        foo: 'baz'
      }, 'BAZ');
      equal(tpl2, '');
      equal(tpl3, {
        foo: 'bar'
      }, 'BAR');
      equal(tpl3, {
        foo: 'baz'
      }, 'BAR');
    });

    it('should compile if blocks', function(done) {
      var tmpl = ('Give me some {% if hungry %}pizza' +
        '{% else %}water{% endif %}');

      equal(tmpl, {
        hungry: true
      }, 'Give me some pizza');
      equal(tmpl, {
        hungry: false
      }, 'Give me some water');
      equal('{% if not hungry %}good{% endif %}',
        {
          hungry: false
        },
        'good');

      equal('{% if hungry and like_pizza %}good{% endif %}',
        {
          hungry: true,
          like_pizza: true
        },
        'good');

      equal('{% if hungry or like_pizza %}good{% endif %}',
        {
          hungry: false,
          like_pizza: true
        },
        'good');

      equal('{% if (hungry or like_pizza) and anchovies %}good{% endif %}',
        {
          hungry: false,
          like_pizza: true,
          anchovies: true
        },
        'good');

      equal(
        '{% if food == "pizza" %}pizza{% endif %}' +
        '{% if food =="beer" %}beer{% endif %}',
        {
          food: 'beer'
        },
        'beer');

      equal('{% if "pizza" in food %}yum{% endif %}',
        {
          food: {
            pizza: true
          }
        },
        'yum');

      equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}',
        {
          pizza: true
        },
        'yum');

      equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}',
        {
          pizza: true
        },
        'yum');

      equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}',
        {
          anchovies: true
        },
        'yuck');

      equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}',
        {
          anchovies: true
        },
        'yuck');

      equal(
        '{% if topping == "pepperoni" %}yum{% elseif topping == "anchovies" %}' +
        'yuck{% else %}hmmm{% endif %}',
        {
          topping: 'sausage'
        },
        'hmmm');

      finish(done);
    });

    it('should compile the ternary operator', function(done) {
      equal('{{ "foo" if bar else "baz" }}', 'baz');
      equal('{{ "foo" if bar else "baz" }}', {
        bar: true
      }, 'foo');

      finish(done);
    });

    it('should compile inline conditionals', function(done) {
      var tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

      equal(tmpl, {
        hungry: true
      }, 'Give me some pizza');
      equal(tmpl, {
        hungry: false
      }, 'Give me some water');
      equal('{{ "good" if not hungry }}',
        {
          hungry: false
        }, 'good');
      equal('{{ "good" if hungry and like_pizza }}',
        {
          hungry: true,
          like_pizza: true
        }, 'good');
      equal('{{ "good" if hungry or like_pizza }}',
        {
          hungry: false,
          like_pizza: true
        }, 'good');
      equal('{{ "good" if (hungry or like_pizza) and anchovies }}',
        {
          hungry: false,
          like_pizza: true,
          anchovies: true
        }, 'good');
      equal(
        '{{ "pizza" if food == "pizza" }}' +
        '{{ "beer" if food == "beer" }}',
        {
          food: 'beer'
        }, 'beer');

      finish(done);
    });

    function runLoopTests(block) {
      var end = {
        asyncAll: 'endall',
        asyncEach: 'endeach',
        for: 'endfor'
      }[block];

      describe('the ' + block + ' tag', function() {
        it('should loop over simple arrays', function() {
          equal(
            '{% ' + block + ' i in arr %}{{ i }}{% ' + end + ' %}',
            { arr: [1, 2, 3, 4, 5] },
            '12345');
        });
        it('should loop normally with an {% else %} tag and non-empty array', function() {
          equal(
            '{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
            { arr: [1, 2, 3, 4, 5] },
            '12345');
        });
        it('should execute the {% else %} block when looping over an empty array', function() {
          equal(
            '{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
            { arr: [] },
            'empty');
        });
        it('should support destructured looping', function() {
          equal(
            '{% ' + block + ' a, b, c in arr %}' +
            '{{ a }},{{ b }},{{ c }}.{% ' + end + ' %}',
            { arr: [['x', 'y', 'z'], ['1', '2', '3']] },
            'x,y,z.1,2,3.');
        });
        it('should do loop over key-values of a literal in-template Object', function() {
          equal(
            '{% ' + block + ' k, v in { one: 1, two: 2 } %}' +
            '-{{ k }}:{{ v }}-{% ' + end + ' %}', '-one:1--two:2-');
        });
        it('should support loop.index', function() {
          equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index }}{% ' + end + ' %}', '123');
        });
        it('should support loop.index0', function() {
          equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index0 }}{% ' + end + ' %}', '012');
        });
        it('should support loop.revindex', function() {
          equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex }}{% ' + end + ' %}', '321');
        });
        it('should support loop.revindex0', function() {
          equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex0 }}{% ' + end + ' %}', '210');
        });
        it('should support loop.first', function() {
          equal(
            '{% ' + block + ' i in [7,3,6] %}' +
            '{% if loop.first %}{{ i }}{% endif %}' +
            '{% ' + end + ' %}',
            '7');
        });
        it('should support loop.last', function() {
          equal(
            '{% ' + block + ' i in [7,3,6] %}' +
            '{% if loop.last %}{{ i }}{% endif %}' +
            '{% ' + end + ' %}',
            '6');
        });
        it('should support loop.length', function() {
          equal('{% ' + block + ' i in [7,3,6] %}{{ loop.length }}{% ' + end + ' %}', '333');
        });
        it('should fail silently when looping over an undefined variable', function() {
          equal('{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}', '');
        });
        it('should fail silently when looping over an undefined property', function() {
          equal(
            '{% ' + block + ' i in foo.bar %}{{ i }}{% ' + end + ' %}',
            { foo: {} },
            '');
        });
        // TODO: this behavior differs from jinja2
        it('should fail silently when looping over a null variable', function() {
          equal(
            '{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}',
            { foo: null },
            '');
        });
        it('should loop over two-dimensional arrays', function() {
          equal('{% ' + block + ' x, y in points %}[{{ x }},{{ y }}]{% ' + end + ' %}',
            { points: [[1, 2], [3, 4], [5, 6]] },
            '[1,2][3,4][5,6]');
        });
        it('should loop over four-dimensional arrays', function() {
          equal(
            '{% ' + block + ' a, b, c, d in arr %}[{{ a }},{{ b }},{{ c }},{{ d }}]{% ' + end + '%}',
            { arr: [[1, 2, 3, 4], [5, 6, 7, 8]] },
            '[1,2,3,4][5,6,7,8]');
        });
        it('should support loop.index with two-dimensional loops', function() {
          equal('{% ' + block + ' x, y in points %}{{ loop.index }}{% ' + end + ' %}',
            {
              points: [[1, 2], [3, 4], [5, 6]]
            },
            '123');
        });
        it('should support loop.revindex with two-dimensional loops', function() {
          equal('{% ' + block + ' x, y in points %}{{ loop.revindex }}{% ' + end + ' %}',
            {
              points: [[1, 2], [3, 4], [5, 6]]
            },
            '321');
        });
        it('should support key-value looping over an Object variable', function() {
          equal('{% ' + block + ' k, v in items %}({{ k }},{{ v }}){% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '(foo,1)(bar,2)');
        });
        it('should support loop.index when looping over an Object\'s key-value pairs', function() {
          equal('{% ' + block + ' k, v in items %}{{ loop.index }}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '12');
        });
        it('should support loop.revindex when looping over an Object\'s key-value pairs', function() {
          equal('{% ' + block + ' k, v in items %}{{ loop.revindex }}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '21');
        });
        it('should support loop.length when looping over an Object\'s key-value pairs', function() {
          equal('{% ' + block + ' k, v in items %}{{ loop.length }}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '22');
        });
        it('should support include tags in the body of the loop', function() {
          equal('{% ' + block + ' item, v in items %}{% include "item.njk" %}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            'showing fooshowing bar');
        });
        it('should work with {% set %} and {% include %} tags', function() {
          equal(
            '{% set item = passed_var %}' +
            '{% include "item.njk" %}\n' +
            '{% ' + block + ' i in passed_iter %}' +
            '{% set item = i %}' +
            '{% include "item.njk" %}\n' +
            '{% ' + end + ' %}',
            {
              passed_var: 'test',
              passed_iter: ['1', '2', '3']
            },
            'showing test\nshowing 1\nshowing 2\nshowing 3\n');
        });
        /* global Set */
        it('should work with Set builtin', function() {
          if (typeof Set === 'undefined') {
            this.skip();
          } else {
            equal('{% ' + block + ' i in set %}{{ i }}{% ' + end + ' %}',
              { set: new Set([1, 2, 3, 4, 5]) },
              '12345');

            equal('{% ' + block + ' i in set %}{{ i }}{% else %}empty{% ' + end + ' %}',
              { set: new Set([1, 2, 3, 4, 5]) },
              '12345');

            equal('{% ' + block + ' i in set %}{{ i }}{% else %}empty{% ' + end + ' %}',
              { set: new Set() },
              'empty');
          }
        });
        /* global Map */
        it('should work with Map builtin', function() {
          if (typeof Map === 'undefined') {
            this.skip();
          } else {
            equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% ' + end + ' %}',
              { map: new Map([[1, 2], [3, 4], [5, 6]]) },
              '[1,2][3,4][5,6]');

            equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% ' + end + ' %}',
              { map: new Map([[1, 2], [3, 4], [5, 6]]) },
              '[1,2][3,4][5,6]');

            equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% ' + end + ' %}',
              { map: new Map() },
              'empty');
          }
        });
      });
    }

    runLoopTests('for');
    runLoopTests('asyncEach');
    runLoopTests('asyncAll');

    it('should allow overriding var with none inside nested scope', function(done) {
      equal(
        '{% set var = "foo" %}' +
        '{% for i in [1] %}{% set var = none %}{{ var }}{% endfor %}',
        '');

      finish(done);
    });

    it('should compile async control', function(done) {
      var opts;
      if (!fs) {
        this.skip();
      } else {
        opts = {
          asyncFilters: {
            getContents: function(tmpl, cb) {
              fs.readFile(tmpl, cb);
            },

            getContentsArr: function(arr, cb) {
              fs.readFile(arr[0], function(err, res) {
                cb(err, [res]);
              });
            }
          }
        };

        render('{{ tmpl | getContents }}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere');
          });

        render('{% if tmpl %}{{ tmpl | getContents }}{% endif %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere');
          });

        render('{% if tmpl | getContents %}yes{% endif %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('yes');
          });

        render('{% for t in [tmpl, tmpl] %}{{ t | getContents }}*{% endfor %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere*somecontenthere*');
          });

        render('{% for t in [tmpl, tmpl] | getContentsArr %}{{ t }}{% endfor %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere');
          });

        render('{% if test %}{{ tmpl | getContents }}{% endif %}oof',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('oof');
          });

        render(
          '{% if tmpl %}' +
          '{% for i in [0, 1] %}{{ tmpl | getContents }}*{% endfor %}' +
          '{% endif %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere*somecontenthere*');
          });

        render('{% block content %}{{ tmpl | getContents }}{% endblock %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere');
          });

        render('{% block content %}hello{% endblock %} {{ tmpl | getContents }}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('hello somecontenthere');
          });

        render('{% block content %}{% set foo = tmpl | getContents %}{{ foo }}{% endblock %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere');
          });

        render('{% block content %}{% include "async.njk" %}{% endblock %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere\n');
          });

        render('{% asyncEach i in [0, 1] %}{% include "async.njk" %}{% endeach %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('somecontenthere\nsomecontenthere\n');
          });

        render('{% asyncAll i in [0, 1, 2, 3, 4] %}-{{ i }}:{% include "async.njk" %}-{% endall %}',
          {
            tmpl: 'tests/templates/for-async-content.njk'
          },
          opts,
          function(err, res) {
            expect(res).to.be('-0:somecontenthere\n-' +
              '-1:somecontenthere\n-' +
              '-2:somecontenthere\n-' +
              '-3:somecontenthere\n-' +
              '-4:somecontenthere\n-');
          });
      }

      finish(done);
    });

    it('should compile basic arithmetic operators', function() {
      equal('{{ 3 + 4 - 5 * 6 / 10 }}', '4');
    });

    it('should compile the exponentiation (**) operator', function() {
      equal('{{ 4**5 }}', '1024');
    });

    it('should compile the integer division (//) operator', function() {
      equal('{{ 9//5 }}', '1');
    });

    it('should compile the modulus operator', function() {
      equal('{{ 9%5 }}', '4');
    });

    it('should compile numeric negation operator', function() {
      equal('{{ -5 }}', '-5');
    });

    it('should compile comparison operators', function() {
      equal('{% if 3 < 4 %}yes{% endif %}', 'yes');
      equal('{% if 3 > 4 %}yes{% endif %}', '');
      equal('{% if 9 >= 10 %}yes{% endif %}', '');
      equal('{% if 10 >= 10 %}yes{% endif %}', 'yes');
      equal('{% if 9 <= 10 %}yes{% endif %}', 'yes');
      equal('{% if 10 <= 10 %}yes{% endif %}', 'yes');
      equal('{% if 11 <= 10 %}yes{% endif %}', '');

      equal('{% if 10 != 10 %}yes{% endif %}', '');
      equal('{% if 10 == 10 %}yes{% endif %}', 'yes');

      equal('{% if "0" == 0 %}yes{% endif %}', 'yes');
      equal('{% if "0" === 0 %}yes{% endif %}', '');
      equal('{% if "0" !== 0 %}yes{% endif %}', 'yes');
      equal('{% if 0 == false %}yes{% endif %}', 'yes');
      equal('{% if 0 === false %}yes{% endif %}', '');

      equal('{% if foo(20) > bar %}yes{% endif %}',
        {
          foo: function(n) {
            return n - 1;
          },
          bar: 15
        },
        'yes');
    });

    it('should compile python-style ternary operators', function() {
      equal('{{ "yes" if 1 is odd else "no"  }}', 'yes');
      equal('{{ "yes" if 2 is even else "no"  }}', 'yes');
      equal('{{ "yes" if 2 is odd else "no"  }}', 'no');
      equal('{{ "yes" if 1 is even else "no"  }}', 'no');
    });

    it('should compile the "in" operator for Arrays', function() {
      equal('{% if 1 in [1, 2] %}yes{% endif %}', 'yes');
      equal('{% if 1 in [2, 3] %}yes{% endif %}', '');
      equal('{% if 1 not in [1, 2] %}yes{% endif %}', '');
      equal('{% if 1 not in [2, 3] %}yes{% endif %}', 'yes');
      equal('{% if "a" in vals %}yes{% endif %}',
        { vals: ['a', 'b'] },
        'yes');
    });

    it('should compile the "in" operator for objects', function() {
      equal('{% if "a" in obj %}yes{% endif %}',
        { obj: { a: true } },
        'yes');
      equal('{% if "a" in obj %}yes{% endif %}',
        { obj: { b: true } },
        '');
    });

    it('should compile the "in" operator for strings', function() {
      equal('{% if "foo" in "foobar" %}yes{% endif %}', 'yes');
    });

    it('should throw an error when using the "in" operator on unexpected types', function(done) {
      render(
        '{% if "a" in 1 %}yes{% endif %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(
            /Cannot use "in" operator to search for "a" in unexpected types\./
          );
        }
      );

      render(
        '{% if "a" in obj %}yes{% endif %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(
            /Cannot use "in" operator to search for "a" in unexpected types\./
          );
        }
      );

      finish(done);
    });

    if (!isSlim) {
      it('should include error line in raised TemplateError', function(done) {
        var tmplStr = [
          '{% set items = ["a", "b",, "c"] %}',
          '{{ items | join(",") }}',
        ].join('\n');

        var loader = new Loader('tests/templates');
        var env = new Environment(loader);
        var tmpl = new Template(tmplStr, env, 'parse-error.njk');

        tmpl.render({}, function(err, res) {
          expect(res).to.be(undefined);
          expect(err.toString()).to.be([
            'Template render error: (parse-error.njk) [Line 1, Column 24]',
            '  unexpected token: ,',
          ].join('\n'));
          done();
        });
      });
    }

    it('should compile string concatenations with tilde', function(done) {
      equal('{{ 4 ~ \'hello\' }}', '4hello');
      equal('{{ 4 ~ 5 }}', '45');
      equal('{{ \'a\' ~ \'b\' ~ 5 }}', 'ab5');
      finish(done);
    });

    it('should compile macros', function(done) {
      equal(
        '{% macro foo() %}This is a macro{% endmacro %}' +
        '{{ foo() }}',
        'This is a macro');
      finish(done);
    });

    it('should compile macros with optional args', function(done) {
      equal(
        '{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
        '{{ foo(1) }}',
        '');
      finish(done);
    });

    it('should compile macros with args that can be passed to filters', function(done) {
      equal(
        '{% macro foo(x) %}{{ x|title }}{% endmacro %}' +
        '{{ foo("foo") }}',
        'Foo');
      finish(done);
    });

    it('should compile macros with positional args', function(done) {
      equal(
        '{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
        '{{ foo(1, 2) }}',
        '2');
      finish(done);
    });

    it('should compile macros with arg defaults', function(done) {
      equal(
        '{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
        '{{ foo(1, 2) }}',
        '2');
      equal(
        '{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
        '{{ foo(1, 2) }}',
        '5');
      finish(done);
    });

    it('should compile macros with keyword args', function(done) {
      equal(
        '{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
        '{{ foo(1, y=2) }}',
        '2');
      finish(done);
    });

    it('should compile macros with only keyword args', function(done) {
      equal(
        '{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(x=1, y=2) }}',
        '125');
      finish(done);
    });

    it('should compile macros with keyword args overriding defaults', function(done) {
      equal(
        '{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(x=1, y=2, z=3) }}',
        '123');
      finish(done);
    });

    it('should compile macros with out-of-order keyword args', function(done) {
      equal(
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(1, z=3) }}',
        '123');
      finish(done);
    });

    it('should compile macros', function(done) {
      equal(
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(1) }}',
        '125');
      finish(done);
    });

    it('should compile macros with multiple overridden arg defaults', function(done) {
      equal(
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(1, 10, 20) }}',
        '11020');
      finish(done);
    });

    it('should compile macro calls inside blocks', function(done) {
      equal(
        '{% extends "base.njk" %}' +
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{% block block1 %}' +
        '{{ foo(1) }}' +
        '{% endblock %}',
        'Foo125BazFizzle');
      finish(done);
    });

    it('should compile macros defined in one block and called in another', function(done) {
      equal(
        '{% block bar %}' +
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{% endblock %}' +
        '{% block baz %}' +
        '{{ foo(1) }}' +
        '{% endblock %}',
        '125');
      finish(done);
    });

    it('should compile macros that include other templates', function(done) {
      equal(
        '{% macro foo() %}{% include "include.njk" %}{% endmacro %}' +
        '{{ foo() }}',
        {
          name: 'james'
        },
        'FooInclude james');
      finish(done);
    });

    it('should compile macros that set vars', function(done) {
      equal(
        '{% macro foo() %}{% set x = "foo"%}{{ x }}{% endmacro %}' +
        '{% set x = "bar" %}' +
        '{{ x }}' +
        '{{ foo() }}' +
        '{{ x }}',
        'barfoobar');

      finish(done);
    });

    it('should not leak variables set in macro to calling scope', function(done) {
      equal(
        '{% macro setFoo() %}' +
        '{% set x = "foo" %}' +
        '{{ x }}' +
        '{% endmacro %}' +
        '{% macro display() %}' +
        '{% set x = "bar" %}' +
        '{{ setFoo() }}' +
        '{{ x }}' +
        '{% endmacro %}' +
        '{{ display() }}',
        'foobar');

      finish(done);
    });

    it('should not leak variables set in nested scope within macro out to calling scope', function(done) {
      equal(
        '{% macro setFoo() %}' +
        '{% for y in [1] %}{% set x = "foo" %}{{ x }}{% endfor %}' +
        '{% endmacro %}' +
        '{% macro display() %}' +
        '{% set x = "bar" %}' +
        '{{ setFoo() }}' +
        '{{ x }}' +
        '{% endmacro %}' +
        '{{ display() }}',
        'foobar');

      finish(done);
    });

    it('should compile macros without leaking set to calling scope', function(done) {
      // This test checks that the issue #577 is resolved.
      // If the bug is not fixed, and set variables leak into the
      // caller scope, there will be too many "foo"s here ("foofoofoo"),
      // because each recursive call will append a "foo" to the
      // variable x in its caller's scope, instead of just its own.
      equal(
        '{% macro foo(topLevel, prefix="") %}' +
        '{% if topLevel %}' +
        '{% set x = "" %}' +
        '{% for i in [1,2] %}' +
        '{{ foo(false, x) }}' +
        '{% endfor %}' +
        '{% else %}' +
        '{% set x = prefix + "foo" %}' +
        '{{ x }}' +
        '{% endif %}' +
        '{% endmacro %}' +
        '{{ foo(true) }}',
        'foofoo');

      finish(done);
    });

    it('should compile macros that cannot see variables in caller scope', function(done) {
      equal(
        '{% macro one(var) %}{{ two() }}{% endmacro %}' +
        '{% macro two() %}{{ var }}{% endmacro %}' +
        '{{ one("foo") }}',
        '');
      finish(done);
    });

    it('should compile call blocks', function(done) {
      equal(
        '{% macro wrap(el) %}' +
        '<{{ el }}>{{ caller() }}</{{ el }}>' +
        '{% endmacro %}' +
        '{% call wrap("div") %}Hello{% endcall %}',
        '<div>Hello</div>');

      finish(done);
    });

    it('should compile call blocks with args', function(done) {
      equal(
        '{% macro list(items) %}' +
        '<ul>{% for i in items %}' +
        '<li>{{ caller(i) }}</li>' +
        '{% endfor %}</ul>' +
        '{% endmacro %}' +
        '{% call(item) list(["a", "b"]) %}{{ item }}{% endcall %}',
        '<ul><li>a</li><li>b</li></ul>');

      finish(done);
    });

    it('should compile call blocks using imported macros', function(done) {
      equal(
        '{% import "import.njk" as imp %}' +
        '{% call imp.wrap("span") %}Hey{% endcall %}',
        '<span>Hey</span>');
      finish(done);
    });

    it('should import templates', function(done) {
      equal(
        '{% import "import.njk" as imp %}' +
        '{{ imp.foo() }} {{ imp.bar }}',
        'Here\'s a macro baz');

      equal(
        '{% from "import.njk" import foo as baz, bar %}' +
        '{{ bar }} {{ baz() }}',
        'baz Here\'s a macro');

      // TODO: Should the for loop create a new frame for each
      // iteration? As it is, `num` is set on all iterations after
      // the first one sets it
      equal(
        '{% for i in [1,2] %}' +
        'start: {{ num }}' +
        '{% from "import.njk" import bar as num %}' +
        'end: {{ num }}' +
        '{% endfor %}' +
        'final: {{ num }}',
        'start: end: bazstart: bazend: bazfinal: ');

      finish(done);
    });

    it('should import templates with context', function(done) {
      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context.njk" as imp with context %}' +
        '{{ imp.foo() }}',
        'Here\'s BAR');

      equal(
        '{% set bar = "BAR" %}' +
        '{% from "import-context.njk" import foo with context %}' +
        '{{ foo() }}',
        'Here\'s BAR');

      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp %}' +
        '{{ bar }}',
        'BAR');

      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp %}' +
        '{{ imp.bar }}',
        'FOO');

      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp with context %}' +
        '{{ bar }}{{ buzz }}',
        'FOO');

      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp with context %}' +
        '{{ imp.bar }}{{ buzz }}',
        'FOO');

      finish(done);
    });

    it('should import templates without context', function(done) {
      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context.njk" as imp without context %}' +
        '{{ imp.foo() }}',
        'Here\'s ');

      equal(
        '{% set bar = "BAR" %}' +
        '{% from "import-context.njk" import foo without context %}' +
        '{{ foo() }}',
        'Here\'s ');

      finish(done);
    });

    it('should default to importing without context', function(done) {
      equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context.njk" as imp %}' +
        '{{ imp.foo() }}',
        'Here\'s ');

      equal(
        '{% set bar = "BAR" %}' +
        '{% from "import-context.njk" import foo %}' +
        '{{ foo() }}',
        'Here\'s ');

      finish(done);
    });

    it('should inherit templates', function(done) {
      equal('{% extends "base.njk" %}', 'FooBarBazFizzle');
      equal('hola {% extends "base.njk" %} hizzle mumble', 'FooBarBazFizzle');

      equal('{% extends "base.njk" %}{% block block1 %}BAR{% endblock %}',
        'FooBARBazFizzle');

      equal(
        '{% extends "base.njk" %}' +
        '{% block block1 %}BAR{% endblock %}' +
        '{% block block2 %}BAZ{% endblock %}',
        'FooBARBAZFizzle');

      equal('hola {% extends tmpl %} hizzle mumble',
        { tmpl: 'base.njk' },
        'FooBarBazFizzle');

      finish(done);
    });
    it('should not call blocks not defined from template inheritance', function(done) {
      var count = 0;
      render(
        '{% extends "base.njk" %}' +
        '{% block notReal %}{{ foo() }}{% endblock %}',
        { foo: function() { count++; } },
        function() {
          expect(count).to.be(0);
        });

      finish(done);
    });

    it('should conditionally inherit templates', function(done) {
      equal(
        '{% if false %}{% extends "base.njk" %}{% endif %}' +
        '{% block block1 %}BAR{% endblock %}',
        'BAR');

      equal(
        '{% if true %}{% extends "base.njk" %}{% endif %}' +
        '{% block block1 %}BAR{% endblock %}',
        'FooBARBazFizzle');

      equal(
        '{% if true %}' +
        '{% extends "base.njk" %}' +
        '{% else %}' +
        '{% extends "base2.njk" %}' +
        '{% endif %}' +
        '{% block block1 %}HELLO{% endblock %}',
        'FooHELLOBazFizzle');

      equal(
        '{% if false %}' +
        '{% extends "base.njk" %}' +
        '{% else %}' +
        '{% extends "base2.njk" %}' +
        '{% endif %}' +
        '{% block item %}hello{{ item }}{% endblock %}',
        'hello1hello2');

      finish(done);
    });

    it('should error if same block is defined multiple times', function(done) {
      var func = function() {
        render(
          '{% extends "simple-base.njk" %}' +
          '{% block test %}{% endblock %}' +
          '{% block test %}{% endblock %}');
      };

      expect(func).to.throwException(/Block "test" defined more than once./);

      finish(done);
    });

    it('should render nested blocks in child template', function(done) {
      equal(
        '{% extends "base.njk" %}' +
        '{% block block1 %}{% block nested %}BAR{% endblock %}{% endblock %}',
        'FooBARBazFizzle');

      finish(done);
    });

    it('should render parent blocks with super()', function(done) {
      equal(
        '{% extends "base.njk" %}' +
        '{% block block1 %}{{ super() }}BAR{% endblock %}',
        'FooBarBARBazFizzle');

      // two levels of `super` should work
      equal(
        '{% extends "base-inherit.njk" %}' +
        '{% block block1 %}*{{ super() }}*{% endblock %}',
        'Foo**Bar**BazFizzle');

      finish(done);
    });

    it('should let super() see global vars from child template', function(done) {
      equal(
        '{% extends "base-show.njk" %}{% set var = "child" %}' +
        '{% block main %}{{ super() }}{% endblock %}',
        'child');

      finish(done);
    });

    it('should not let super() see vars from child block', function(done) {
      equal(
        '{% extends "base-show.njk" %}' +
        '{% block main %}{% set var = "child" %}{{ super() }}{% endblock %}',
        '');

      finish(done);
    });

    it('should let child templates access parent global scope', function(done) {
      equal(
        '{% extends "base-set.njk" %}' +
        '{% block main %}{{ var }}{% endblock %}',
        'parent');

      finish(done);
    });

    it('should not let super() modify calling scope', function(done) {
      equal(
        '{% extends "base-set-inside-block.njk" %}' +
        '{% block main %}{{ super() }}{{ var }}{% endblock %}',
        '');

      finish(done);
    });

    it('should not let child templates set vars in parent scope', function(done) {
      equal(
        '{% extends "base-set-and-show.njk" %}' +
        '{% block main %}{% set var = "child" %}{% endblock %}',
        'parent');

      finish(done);
    });

    it('should render blocks in their own scope', function(done) {
      equal(
        '{% set var = "parent" %}' +
        '{% block main %}{% set var = "inner" %}{% endblock %}' +
        '{{ var }}',
        'parent');

      finish(done);
    });

    it('should include templates', function(done) {
      equal('hello world {% include "include.njk" %}',
        'hello world FooInclude ');
      finish(done);
    });

    it('should include 130 templates without call stack size exceed', function(done) {
      equal('{% include "includeMany.njk" %}',
        new Array(131).join('FooInclude \n'));
      finish(done);
    });

    it('should include templates with context', function(done) {
      equal('hello world {% include "include.njk" %}',
        {
          name: 'james'
        },
        'hello world FooInclude james');
      finish(done);
    });

    it('should include templates that can see including scope, but not write to it', function(done) {
      equal('{% set var = 1 %}{% include "include-set.njk" %}{{ var }}', '12\n1');
      finish(done);
    });

    it('should include templates dynamically', function(done) {
      equal('hello world {% include tmpl %}',
        {
          name: 'thedude',
          tmpl: 'include.njk'
        },
        'hello world FooInclude thedude');
      finish(done);
    });

    it('should include templates dynamically based on a set var', function(done) {
      equal('hello world {% set tmpl = "include.njk" %}{% include tmpl %}',
        {
          name: 'thedude'
        },
        'hello world FooInclude thedude');
      finish(done);
    });

    it('should include templates dynamically based on an object attr', function(done) {
      equal('hello world {% include data.tmpl %}',
        {
          name: 'thedude',
          data: {
            tmpl: 'include.njk'
          }
        },
        'hello world FooInclude thedude');

      finish(done);
    });

    it('should throw an error when including a file that does not exist', function(done) {
      render(
        '{% include "missing.njk" %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/template not found: missing.njk/);
        }
      );

      finish(done);
    });

    it('should fail silently on missing templates if requested', function(done) {
      equal('hello world {% include "missing.njk" ignore missing %}',
        'hello world ');

      equal('hello world {% include "missing.njk" ignore missing %}',
        {
          name: 'thedude'
        },
        'hello world ');

      finish(done);
    });

    /**
     * This test checks that this issue is resolved: http://stackoverflow.com/questions/21777058/loop-index-in-included-nunjucks-file
     */
    it('should have access to "loop" inside an include', function(done) {
      equal('{% for item in [1,2,3] %}{% include "include-in-loop.njk" %}{% endfor %}',
        '1,0,true\n2,1,false\n3,2,false\n');

      equal('{% for k,v in items %}{% include "include-in-loop.njk" %}{% endfor %}',
        {
          items: {
            a: 'A',
            b: 'B'
          }
        },
        '1,0,true\n2,1,false\n');

      finish(done);
    });

    it('should maintain nested scopes', function(done) {
      equal(
        '{% for i in [1,2] %}' +
        '{% for i in [3,4] %}{{ i }}{% endfor %}' +
        '{{ i }}{% endfor %}',
        '341342');

      finish(done);
    });

    it('should allow blocks in for loops', function(done) {
      equal(
        '{% extends "base2.njk" %}' +
        '{% block item %}hello{{ item }}{% endblock %}',
        'hello1hello2');

      finish(done);
    });

    it('should make includes inherit scope', function(done) {
      equal(
        '{% for item in [1,2] %}' +
        '{% include "item.njk" %}' +
        '{% endfor %}',
        'showing 1showing 2');

      finish(done);
    });

    it('should compile a set block', function(done) {
      equal('{% set username = "foo" %}{{ username }}',
        {
          username: 'james'
        },
        'foo');

      equal('{% set x, y = "foo" %}{{ x }}{{ y }}',
        'foofoo');

      equal('{% set x = 1 + 2 %}{{ x }}',
        '3');

      equal('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',
        {
          foo: 2
        },
        '2');

      equal('{% include "set.njk" %}{{ foo }}',
        {
          foo: 'bar'
        },
        'bar');

      equal('{% set username = username + "pasta" %}{{ username }}',
        {
          username: 'basta'
        },
        'bastapasta');

      // `set` should only set within its current scope
      equal(
        '{% for i in [1] %}{% set val=5 %}{% endfor %}' +
        '{{ val }}',
        '');

      equal(
        '{% for i in [1,2,3] %}' +
        '{% if not val %}{% set val=5 %}{% endif %}' +
        '{% set val=val+1 %}{{ val }}' +
        '{% endfor %}' +
        'afterwards: {{ val }}',
        '678afterwards: ');

      // however, like Python, if a variable has been set in an
      // above scope, any other set should correctly resolve to
      // that frame
      equal(
        '{% set val=1 %}' +
        '{% for i in [1] %}{% set val=5 %}{% endfor %}' +
        '{{ val }}',
        '5');

      equal(
        '{% set val=5 %}' +
        '{% for i in [1,2,3] %}' +
        '{% set val=val+1 %}{{ val }}' +
        '{% endfor %}' +
        'afterwards: {{ val }}',
        '678afterwards: 8');

      finish(done);
    });

    it('should compile set with frame references', function(done) {
      equal('{% set username = user.name %}{{ username }}',
        {
          user: {
            name: 'james'
          }
        },
        'james');

      finish(done);
    });

    it('should compile set assignments of the same variable', function(done) {
      equal(
        '{% set x = "hello" %}' +
        '{% if false %}{% set x = "world" %}{% endif %}' +
        '{{ x }}',
        'hello');

      equal(
        '{% set x = "blue" %}' +
        '{% if true %}{% set x = "green" %}{% endif %}' +
        '{{ x }}',
        'green');

      finish(done);
    });

    it('should compile block-set', function(done) {
      equal(
        '{% set block_content %}{% endset %}' +
        '{{ block_content }}',
        ''
      );

      /**
       * Capture blocks inside macros were printing to the main buffer instead of
       * the temporary one, see https://github.com/mozilla/nunjucks/issues/914.
       **/
      equal(
        '{%- macro foo(bar) -%}' +
        '{%- set test -%}foo{%- endset -%}' +
        '{{ bar }}{{ test }}' +
        '{%- endmacro -%}' +
        '{{ foo("bar") }}',
        'barfoo'
      );

      equal(
        '{% set block_content %}test string{% endset %}' +
        '{{ block_content }}',
        'test string'
      );

      equal(
        '{% set block_content %}' +
        '{% for item in [1, 2, 3] %}' +
        '{% include "item.njk" %} ' +
        '{% endfor %}' +
        '{% endset %}' +
        '{{ block_content }}',
        'showing 1 showing 2 showing 3 '
      );

      equal(
        '{% set block_content %}' +
        '{% set inner_block_content %}' +
        '{% for i in [1, 2, 3] %}' +
        'item {{ i }} ' +
        '{% endfor %}' +
        '{% endset %}' +
        '{% for i in [1, 2, 3] %}' +
        'inner {{i}}: "{{ inner_block_content }}" ' +
        '{% endfor %}' +
        '{% endset %}' +
        '{{ block_content | safe }}',
        'inner 1: "item 1 item 2 item 3 " ' +
        'inner 2: "item 1 item 2 item 3 " ' +
        'inner 3: "item 1 item 2 item 3 " '
      );

      equal(
        '{% set x,y,z %}' +
        'cool' +
        '{% endset %}' +
        '{{ x }} {{ y }} {{ z }}',
        'cool cool cool'
      );

      finish(done);
    });

    it('should compile block-set wrapping an inherited block', function(done) {
      equal(
        '{% extends "base-set-wraps-block.njk" %}' +
        '{% block somevar %}foo{% endblock %}',
        'foo\n'
      );
      finish(done);
    });

    it('should throw errors', function(done) {
      render('{% from "import.njk" import boozle %}',
        {},
        {
          noThrow: true
        },
        function(err) {
          expect(err).to.match(/cannot import 'boozle'/);
        });

      finish(done);
    });

    it('should allow custom tag compilation', function(done) {
      function TestExtension() {
        this.tags = ['test'];

        this.parse = function(parser, nodes) {
          var content;
          var tag;
          parser.advanceAfterBlockEnd();

          content = parser.parseUntilBlocks('endtest');
          tag = new nodes.CallExtension(this, 'run', null, [content]);
          parser.advanceAfterBlockEnd();

          return tag;
        };

        this.run = function(context, content) {
          // Reverse the string
          return content().split('').reverse().join('');
        };
      }

      equal('{% test %}123456789{% endtest %}', null,
        { extensions: { TestExtension: new TestExtension() } },
        '987654321');

      finish(done);
    });

    it('should allow custom tag compilation without content', function(done) {
      function TestExtension() {
        // jshint validthis: true
        this.tags = ['test'];

        this.parse = function(parser, nodes) {
          var tok = parser.nextToken();
          var args = parser.parseSignature(null, true);
          parser.advanceAfterBlockEnd(tok.value);

          return new nodes.CallExtension(this, 'run', args, null);
        };

        this.run = function(context, arg1) {
          // Reverse the string
          return arg1.split('').reverse().join('');
        };
      }

      equal('{% test "123456" %}', null,
        { extensions: { TestExtension: new TestExtension() } },
        '654321');

      finish(done);
    });

    it('should allow complicated custom tag compilation', function(done) {
      function TestExtension() {
        // jshint validthis: true
        this.tags = ['test'];

        /* normally this is automatically done by Environment */
        this._name = TestExtension;

        this.parse = function(parser, nodes, lexer) {
          var body;
          var intermediate = null;

          parser.advanceAfterBlockEnd();

          body = parser.parseUntilBlocks('intermediate', 'endtest');

          if (parser.skipSymbol('intermediate')) {
            parser.skip(lexer.TOKEN_BLOCK_END);
            intermediate = parser.parseUntilBlocks('endtest');
          }

          parser.advanceAfterBlockEnd();

          return new nodes.CallExtension(this, 'run', null, [body, intermediate]);
        };

        this.run = function(context, body, intermediate) {
          var output = body().split('').join(',');
          if (intermediate) {
            // Reverse the string.
            output += intermediate().split('').reverse().join('');
          }
          return output;
        };
      }

      equal('{% test %}abcdefg{% endtest %}', null,
        { extensions: { TestExtension: new TestExtension() } },
        'a,b,c,d,e,f,g');

      equal('{% test %}abcdefg{% intermediate %}second half{% endtest %}',
        null,
        { extensions: { TestExtension: new TestExtension() } },
        'a,b,c,d,e,f,gflah dnoces');

      finish(done);
    });

    it('should allow custom tag with args compilation', function(done) {
      var opts;

      function TestExtension() {
        // jshint validthis: true
        this.tags = ['test'];

        /* normally this is automatically done by Environment */
        this._name = TestExtension;

        this.parse = function(parser, nodes) {
          var body;
          var args;
          var tok = parser.nextToken();

          // passing true makes it tolerate when no args exist
          args = parser.parseSignature(true);
          parser.advanceAfterBlockEnd(tok.value);

          body = parser.parseUntilBlocks('endtest');
          parser.advanceAfterBlockEnd();

          return new nodes.CallExtension(this, 'run', args, [body]);
        };

        this.run = function(context, prefix, kwargs, body) {
          var output;
          if (typeof prefix === 'function') {
            body = prefix;
            prefix = '';
            kwargs = {};
          } else if (typeof kwargs === 'function') {
            body = kwargs;
            kwargs = {};
          }

          output = prefix + body().split('').reverse().join('');
          if (kwargs.cutoff) {
            output = output.slice(0, kwargs.cutoff);
          }

          return output;
        };
      }

      opts = {
        extensions: {
          TestExtension: new TestExtension()
        }
      };

      equal(
        '{% test %}foobar{% endtest %}', null, opts,
        'raboof');

      equal(
        '{% test("biz") %}foobar{% endtest %}', null, opts,
        'bizraboof');

      equal(
        '{% test("biz", cutoff=5) %}foobar{% endtest %}', null, opts,
        'bizra');

      finish(done);
    });

    it('should autoescape by default', function(done) {
      equal('{{ foo }}', {
        foo: '"\'<>&'
      }, '&quot;&#39;&lt;&gt;&amp;');
      finish(done);
    });

    it('should autoescape if autoescape is on', function(done) {
      equal(
        '{{ foo }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '&quot;&#39;&lt;&gt;&amp;');

      equal('{{ foo|reverse }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '&amp;&gt;&lt;&#39;&quot;');

      equal(
        '{{ foo|reverse|safe }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '&><\'"');

      equal(
        '{{ foo }}',
        { foo: null },
        { autoescape: true },
        '');

      equal(
        '{{ foo }}',
        { foo: ['<p>foo</p>'] },
        { autoescape: true },
        '&lt;p&gt;foo&lt;/p&gt;');

      equal(
        '{{ foo }}',
        { foo: { toString: function() { return '<p>foo</p>'; } } },
        { autoescape: true },
        '&lt;p&gt;foo&lt;/p&gt;');

      equal('{{ foo | safe }}',
        { foo: null },
        { autoescape: true },
        '');

      equal(
        '{{ foo | safe }}',
        { foo: '<p>foo</p>' },
        { autoescape: true },
        '<p>foo</p>');

      equal(
        '{{ foo | safe }}',
        { foo: ['<p>foo</p>'] },
        { autoescape: true },
        '<p>foo</p>');

      equal(
        '{{ foo | safe }}',
        { foo: { toString: function() { return '<p>foo</p>'; } } },
        { autoescape: true },
        '<p>foo</p>');

      finish(done);
    });

    it('should not autoescape safe strings', function(done) {
      equal(
        '{{ foo|safe }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '"\'<>&');

      finish(done);
    });

    it('should not autoescape macros', function(done) {
      render(
        '{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
        '{{ foo("<>&", "<>") }}',
        null,
        {
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('&lt;&gt;&amp; and &lt;&gt;');
        }
      );

      render(
        '{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
        '{{ foo("<>&", "<>") }}',
        null,
        {
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('<>& and &lt;&gt;');
        }
      );

      finish(done);
    });

    it('should not autoescape super()', function(done) {
      render(
        '{% extends "base3.njk" %}' +
        '{% block block1 %}{{ super() }}{% endblock %}',
        null,
        {
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('<b>Foo</b>');
        }
      );

      finish(done);
    });

    it('should not autoescape when extension set false', function(done) {
      function TestExtension() {
        // jshint validthis: true
        this.tags = ['test'];

        this.autoescape = false;

        this.parse = function(parser, nodes) {
          var tok = parser.nextToken();
          var args = parser.parseSignature(null, true);
          parser.advanceAfterBlockEnd(tok.value);
          return new nodes.CallExtension(this, 'run', args, null);
        };

        this.run = function() {
          // Reverse the string
          return '<b>Foo</b>';
        };
      }

      render(
        '{% test "123456" %}',
        null,
        {
          extensions: { TestExtension: new TestExtension() },
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('<b>Foo</b>');
        }
      );

      finish(done);
    });

    it('should pass context as this to filters', function(done) {
      render(
        '{{ foo | hallo }}',
        { foo: 1, bar: 2 },
        {
          filters: {
            hallo: function(foo) {
              return foo + this.lookup('bar');
            }
          }
        },
        function(err, res) {
          expect(res).to.be('3');
        }
      );

      finish(done);
    });

    it('should render regexs', function(done) {
      equal('{{ r/name [0-9] \\// }}',
        '/name [0-9] \\//');

      equal('{{ r/x/gi }}',
        '/x/gi');

      finish(done);
    });

    it('should throw an error when {% call %} is passed an object that is not a function', function(done) {
      render(
        '{% call foo() %}{% endcall %}',
        {foo: 'bar'},
        {noThrow: true},
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is not a function/);
        });

      finish(done);
    });

    it('should throw an error when including a file that calls an undefined macro', function(done) {
      render(
        '{% include "undefined-macro.njk" %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is undefined or falsey/);
        }
      );

      finish(done);
    });

    it('should throw an error when including a file that calls an undefined macro even inside {% if %} tag', function(done) {
      render(
        '{% if true %}{% include "undefined-macro.njk" %}{% endif %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is undefined or falsey/);
        }
      );

      finish(done);
    });

    it('should throw an error when including a file that imports macro that calls an undefined macro', function(done) {
      render(
        '{% include "import-macro-call-undefined-macro.njk" %}',
        { list: [1, 2, 3] },
        { noThrow: true },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is undefined or falsey/);
        }
      );

      finish(done);
    });


    it('should control whitespaces correctly', function(done) {
      equal(
        '{% if true -%}{{"hello"}} {{"world"}}{% endif %}',
        'hello world');

      equal(
        '{% if true -%}{% if true %} {{"hello"}} {{"world"}}'
        + '{% endif %}{% endif %}',
        ' hello world');

      equal(
        '{% if true -%}{# comment #} {{"hello"}}{% endif %}',
        ' hello');

      finish(done);
    });

    it('should control expression whitespaces correctly', function(done) {
      equal(
        'Well, {{- \' hello, \' -}} my friend',
        'Well, hello, my friend'
      );

      equal(' {{ 2 + 2 }} ', ' 4 ');

      equal(' {{-2 + 2 }} ', '4 ');

      equal(' {{ -2 + 2 }} ', ' 0 ');

      equal(' {{ 2 + 2 -}} ', ' 4');

      finish(done);
    });

    it('should get right value when macro parameter conflict with global macro name', function(done) {
      render(
        '{# macro1 and macro2 definition #}' +
        '{% macro macro1() %}' +
        '{% endmacro %}' +
        '' +
        '{% macro macro2(macro1="default") %}' +
        '{{macro1}}' +
        '{% endmacro %}' +
        '' +
        '{# calling macro2 #}' +
        '{{macro2("this should be outputted") }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('this should be outputted');
        });

      finish(done);
    });

    it('should get right value when macro include macro', function(done) {
      render(
        '{# macro1 and macro2 definition #}' +
        '{% macro macro1() %} foo' +
        '{% endmacro %}' +
        '' +
        '{% macro macro2(text="default") %}' +
        '{{macro1()}}' +
        '{% endmacro %}' +
        '' +
        '{# calling macro2 #}' +
        '{{macro2("this should not be outputted") }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('foo');
        });

      finish(done);
    });

    it('should allow access to outer scope in call blocks', function(done) {
      render(
        '{% macro inside() %}' +
        '{{ caller() }}' +
        '{% endmacro %}' +
        '{% macro outside(var) %}' +
        '{{ var }}\n' +
        '{% call inside() %}' +
        '{{ var }}' +
        '{% endcall %}' +
        '{% endmacro %}' +
        '{{ outside("foobar") }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('foobar\nfoobar');
        });

      finish(done);
    });

    it('should not leak scope from call blocks to parent', function(done) {
      render(
        '{% set var = "expected" %}' +
        '{% macro inside() %}' +
        '{% set var = "incorrect-value" %}' +
        '{{ caller() }}' +
        '{% endmacro %}' +
        '{% macro outside() %}' +
        '{% call inside() %}' +
        '{% endcall %}' +
        '{% endmacro %}' +
        '{{ outside() }}' +
        '{{ var }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('expected');
        });

      finish(done);
    });


    if (!isSlim) {
      it('should import template objects', function(done) {
        var tmpl = new Template('{% macro foo() %}Inside a macro{% endmacro %}' +
          '{% set bar = "BAZ" %}');

        equal(
          '{% import tmpl as imp %}' +
          '{{ imp.foo() }} {{ imp.bar }}',
          {
            tmpl: tmpl
          },
          'Inside a macro BAZ');

        equal(
          '{% from tmpl import foo as baz, bar %}' +
          '{{ bar }} {{ baz() }}',
          {
            tmpl: tmpl
          },
          'BAZ Inside a macro');

        finish(done);
      });

      it('should inherit template objects', function(done) {
        var tmpl = new Template('Foo{% block block1 %}Bar{% endblock %}' +
          '{% block block2 %}Baz{% endblock %}Whizzle');

        equal('hola {% extends tmpl %} fizzle mumble',
          {
            tmpl: tmpl
          },
          'FooBarBazWhizzle');

        equal(
          '{% extends tmpl %}' +
          '{% block block1 %}BAR{% endblock %}' +
          '{% block block2 %}BAZ{% endblock %}',
          {
            tmpl: tmpl
          },
          'FooBARBAZWhizzle');

        finish(done);
      });

      it('should include template objects', function(done) {
        var tmpl = new Template('FooInclude {{ name }}');

        equal('hello world {% include tmpl %}',
          {
            name: 'thedude',
            tmpl: tmpl
          },
          'hello world FooInclude thedude');

        finish(done);
      });

      it('should throw an error when invalid expression whitespaces are used', function(done) {
        render(
          ' {{ 2 + 2- }}',
          {},
          {
            noThrow: true
          },
          function(err, res) {
            expect(res).to.be(undefined);
            expect(err).to.match(/unexpected token: }}/);
          }
        );

        finish(done);
      });
    }
  });

  describe('the filter tag', function() {
    it('should apply the title filter to the body', function(done) {
      equal('{% filter title %}may the force be with you{% endfilter %}',
        'May The Force Be With You');
      finish(done);
    });

    it('should apply the replace filter to the body', function(done) {
      equal('{% filter replace("force", "forth") %}may the force be with you{% endfilter %}',
        'may the forth be with you');
      finish(done);
    });

    it('should work with variables in the body', function(done) {
      equal('{% set foo = "force" %}{% filter replace("force", "forth") %}may the {{ foo }} be with you{% endfilter %}',
        'may the forth be with you');
      finish(done);
    });

    it('should work with blocks in the body', function(done) {
      equal(
        '{% extends "filter-block.html" %}' +
        '{% block block1 %}force{% endblock %}',
        'may the forth be with you\n');
      finish(done);
    });
  });

  describe('compile expressions', function() {
    it('should compile expressions', function(done) {
      let env = new Environment();
      let expr = env.compileExpression('foo');
      expect(expr()).to.equal(undefined);
      expect(expr({foo: 42})).to.equal(42);
      let expr2 = env.compileExpression('42 + foo | string | int');
      expect(expr2({foo: 42})).to.equal(84);
      finish(done);
    });

    it('should throw when {throwOnUndefined: true}', function(done) {
      expect(function() {
        let env = new Environment(null, {throwOnUndefined: true});
        env.compileExpression('foo')();
      }).to.throwError();
      finish(done);
    });
  });
}());
