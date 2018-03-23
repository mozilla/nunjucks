(function() {
  'use strict';

  var expect;
  var util;
  var lib;
  var r;
  var render;
  var equal;
  var finish;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
    lib = require('../nunjucks/src/lib');
    r = require('../nunjucks/src/runtime');
  } else {
    expect = window.expect;
    util = window.util;
    lib = nunjucks.lib;
    r = nunjucks.runtime;
  }

  render = util.render;
  equal = util.equal;
  finish = util.finish;

  describe('filter', function() {
    it('abs', function(done) {
      equal('{{ -3|abs }}', '3');
      equal('{{ -3.456|abs }}', '3.456');
      finish(done);
    });

    it('batch', function(done) {
      equal(
        [
          '{% for a in [1,2,3,4,5,6]|batch(2) %}',
          '-{% for b in a %}',
          '{{ b }}',
          '{% endfor %}-',
          '{% endfor %}'].join(''),
        '-12--34--56-');

      finish(done);
    });

    it('capitalize', function(done) {
      equal('{{ "foo" | capitalize }}', 'Foo');
      equal('{{ str | capitalize }}', {
        str: r.markSafe('foo')
      }, 'Foo');
      equal('{{ undefined | capitalize }}', '');
      equal('{{ null | capitalize }}', '');
      equal('{{ nothing | capitalize }}', '');
      finish(done);
    });

    it('center', function(done) {
      equal('{{ "fooo" | center }}',
        lib.repeat(' ', 38) + 'fooo' +
        lib.repeat(' ', 38));

      equal('{{ str | center }}',
        {str: r.markSafe('fooo')},
        lib.repeat(' ', 38) + 'fooo' + lib.repeat(' ', 38));

      equal('{{ undefined | center }}',
        lib.repeat(' ', 40) + '' +
        lib.repeat(' ', 40));

      equal('{{ null | center }}',
        lib.repeat(' ', 40) + '' +
        lib.repeat(' ', 40));

      equal('{{ nothing | center }}',
        lib.repeat(' ', 40) + '' +
        lib.repeat(' ', 40));

      equal('{{ "foo" | center }}',
        lib.repeat(' ', 38) + 'foo' +
        lib.repeat(' ', 39));
      finish(done);
    });

    it('default', function(done) {
      equal('{{ undefined | default("foo") }}', 'foo');
      equal('{{ bar | default("foo") }}', {
        bar: null
      }, '');
      equal('{{ false | default("foo") }}', 'false');
      equal('{{ false | default("foo", true) }}', 'foo');
      equal('{{ bar | default("foo") }}', 'foo');
      equal('{{ "bar" | default("foo") }}', 'bar');
      finish(done);
    });

    it('dump', function() {
      equal('{{ [\'a\', 1, {b: true}] | dump  }}',
        '[&quot;a&quot;,1,{&quot;b&quot;:true}]');
      equal('{{ [\'a\', 1, {b: true}] | dump(2) }}',
        '[\n  &quot;a&quot;,\n  1,\n  {\n    &quot;b&quot;: true\n  }\n]');
      equal('{{ [\'a\', 1, {b: true}] | dump(4) }}',
        '[\n    &quot;a&quot;,\n    1,\n    {\n        &quot;b&quot;: true\n    }\n]');
      equal('{{ [\'a\', 1, {b: true}] | dump(\'\t\') }}',
        '[\n\t&quot;a&quot;,\n\t1,\n\t{\n\t\t&quot;b&quot;: true\n\t}\n]');
    });

    it('escape', function() {
      equal(
        '{{ "<html>" | escape }}', {},
        { autoescape: false },
        '&lt;html&gt;');
    });

    it('escape skip safe', function() {
      equal('{{ "<html>" | safe | escape }}', {},
        { autoescape: false },
        '<html>');
    });

    it('should not double escape strings', function() {
      equal('{{ "<html>" | escape | escape }}', {},
        { autoescape: false },
        '&lt;html&gt;');
    });

    it('should not double escape with autoescape on', function() {
      equal('{% set val = "<html>" | escape %}{{ val }}', {},
        { autoescape: true },
        '&lt;html&gt;');
    });

    it('should work with non-string values', function() {
      equal(
        '{{ foo | escape }}',
        { foo: ['<html>'] },
        { autoescape: false },
        '&lt;html&gt;');

      equal(
        '{{ foo | escape }}',
        { foo: { toString: function() { return '<html>'; } } },
        { autoescape: false },
        '&lt;html&gt;');

      equal('{{ foo | escape }}',
        { foo: null },
        { autoescape: false },
        '');
    });

    it('should not escape safe strings with autoescape on', function() {
      equal(
        '{{ "<html>" | safe | escape }}', {},
        { autoescape: true },
        '<html>');

      equal(
        '{% set val = "<html>" | safe | e %}{{ val }}', {},
        { autoescape: true },
        '<html>');
    });

    it('should keep strings escaped after they have been escaped', function() {
      equal(
        '{% set val = "<html>" | e | safe %}{{ val }}', {},
        { autoescape: false },
        '&lt;html&gt;');
    });

    it('dictsort', function(done) {
      // no real foolproof way to test that a js obj has been transformed
      // from unsorted -> sorted, as its enumeration ordering is undefined
      // and might fluke being sorted originally .. lets just init with some jumbled
      // keys

      // no params - should be case insensitive, by key
      equal(
        '{% for item in items | dictsort %}' +
        '{{ item[0] }}{% endfor %}',
        {
          items: {
            e: 1,
            d: 2,
            c: 3,
            a: 4,
            f: 5,
            b: 6
          }
        },
        'abcdef');

      // case sensitive = true
      equal(
        '{% for item in items | dictsort(true) %}{{ item[0] }},{% endfor %}', {
          items: {
            ABC: 6,
            ABc: 5,
            Abc: 1,
            abc: 2
          }
        },
        'ABC,ABc,Abc,abc,');

      // use values for sort
      equal(
        '{% for item in items | dictsort(false, "value") %}{{ item[0] }}{% endfor %}', {
          items: {
            a: 6,
            b: 5,
            c: 1,
            d: 2
          }
        },
        'cdba');

      finish(done);
    });

    it('first', function(done) {
      equal('{{ [1,2,3] | first }}', '1');
      finish(done);
    });

    it('float', function() {
      equal('{{ "3.5" | float }}', '3.5');
      equal('{{ "0" | float }}', '0');
    });

    it('forceescape', function(done) {
      equal('{{ str | forceescape }}', { str: r.markSafe('<html>')}, '&lt;html&gt;');
      equal('{{ "<html>" | safe | forceescape }}', '&lt;html&gt;');
      finish(done);
    });

    it('int', function() {
      equal('{{ "3.5" | int }}', '3');
      equal('{{ "0" | int }}', '0');
    });

    it('int (default value)', function() {
      equal('{{ "bob" | int("cat") }}', 'cat');
    });

    it('float (default value)', function() {
      equal('{{ "bob" | float("cat") }}', 'cat');
    });

    it('groupby', function(done) {
      equal(
        '{% for type, items in items | groupby("type") %}' +
        ':{{ type }}:' +
        '{% for item in items %}' +
        '{{ item.name }}' +
        '{% endfor %}' +
        '{% endfor %}',
        {
          items: [{
            name: 'james',
            type: 'green'
          },
          {
            name: 'john',
            type: 'blue'
          },
          {
            name: 'jim',
            type: 'blue'
          },
          {
            name: 'jessie',
            type: 'green'
          }]
        },
        ':green:jamesjessie:blue:johnjim');

      finish(done);
    });

    it('indent', function(done) {
      equal('{{ "one\ntwo\nthree" | indent }}',
        'one\n    two\n    three\n');
      equal('{{ "one\ntwo\nthree" | indent(2) }}',
        'one\n  two\n  three\n');
      equal('{{ "one\ntwo\nthree" | indent(2, true) }}',
        '  one\n  two\n  three\n');

      equal('{{ str | indent }}', {
        str: r.markSafe('one\ntwo\nthree')
      }, 'one\n    two\n    three\n');

      equal('{{ "" | indent }}', '');
      equal('{{ undefined | indent }}', '');
      equal('{{ undefined | indent(2) }}', '');
      equal('{{ undefined | indent(2, true) }}', '');

      equal('{{ null | indent }}', '');
      equal('{{ null | indent(2) }}', '');
      equal('{{ null | indent(2, true) }}', '');

      equal('{{ nothing | indent }}', '');
      equal('{{ nothing | indent(2) }}', '');
      equal('{{ nothing | indent(2, true) }}', '');
      finish(done);
    });

    it('join', function(done) {
      equal('{{ items | join }}',
        {
          items: [1, 2, 3]
        },
        '123');

      equal('{{ items | join(",") }}',
        {
          items: ['foo', 'bar', 'bear']
        },
        'foo,bar,bear');

      equal('{{ items | join(",", "name") }}',
        {
          items: [{
            name: 'foo'
          },
          {
            name: 'bar'
          },
          {
            name: 'bear'
          }]
        },
        'foo,bar,bear');
      finish(done);
    });

    it('last', function(done) {
      equal('{{ [1,2,3] | last }}', '3');
      finish(done);
    });

    describe('the length filter', function suite() {
      it('should return length of a list literal', function test() {
        equal('{{ [1,2,3] | length }}', '3');
      });
      it('should output 0 for a missing context variable', function test() {
        equal('{{ blah|length }}', '0');
      });
      it('should output string length for string variables', function test() {
        equal('{{ str | length }}', {
          str: 'blah'
        }, '4');
      });
      it('should output string length for a SafeString variable', function test() {
        equal('{{ str | length }}', {
          str: r.markSafe('<blah>')
        }, '6');
      });
      it('should output the correct length of a string created with new String()', function test() {
        equal('{{ str | length }}', {
          str: new String('blah') // eslint-disable-line no-new-wrappers
        }, '4');
      });
      it('should output 0 for a literal "undefined"', function test() {
        equal('{{ undefined | length }}', '0');
      });
      it('should output 0 for a literal "null"', function test() {
        equal('{{ null | length }}', '0');
      });
      it('should output 0 for an Object with no properties', function test() {
        equal('{{ obj | length }}', {
          obj: {}
        }, '0');
      });
      it('should output 1 for an Object with 1 property', function test() {
        equal('{{ obj | length }}', {
          obj: {
            key: 'value'
          }
        }, '1');
      });
      it('should output the number of properties for a plain Object, not the value of its length property', function test() {
        equal('{{ obj | length }}', {
          obj: {
            key: 'value',
            length: 5
          }
        }, '2');
      });
      it('should output the length of an array', function test() {
        equal('{{ arr | length }}', {
          arr: [0, 1]
        }, '2');
      });
      it('should output the full length of a sparse array', function test() {
        equal('{{ arr | length }}', {
          arr: [0,, 2]  // eslint-disable-line
        }, '3');
      });
      it('should output the length of an array created with "new Array"', function test() {
        equal('{{ arr | length }}', {
          arr: new Array(0, 1) // eslint-disable-line no-array-constructor
        }, '2');
      });
      it('should output the length of an array created with "new Array" with user-defined properties', function test() {
        var arr = new Array(0, 1); // eslint-disable-line no-array-constructor
        arr.key = 'value';
        equal('{{ arr | length }}', {
          arr: arr
        }, '2');
      });
      it('should output the length of a Map', function test() {
        /* global Map */
        var map;
        if (typeof Map === 'undefined') {
          this.skip();
        } else {
          map = new Map([['key1', 'value1'], ['key2', 'value2']]);
          map.set('key3', 'value3');
          equal('{{ map | length }}', {
            map: map
          }, '3');
        }
      });
      it('should output the length of a Set', function test() {
        /* global Set */
        var set;
        if (typeof Set === 'undefined') {
          this.skip();
        } else {
          set = new Set(['value1']);
          set.add('value2');
          equal('{{ set | length }}', { set: set }, '2');
        }
      });
    });

    it('list', function(done) {
      var person = {
        name: 'Joe',
        age: 83
      };
      equal('{% for i in "foobar" | list %}{{ i }},{% endfor %}',
        'f,o,o,b,a,r,');
      equal('{% for pair in person | list %}{{ pair.key }}: {{ pair.value }} - {% endfor %}',
        {
          person: person
        }, 'name: Joe - age: 83 - ');
      equal('{% for i in [1, 2] | list %}{{ i }}{% endfor %}', '12');
      finish(done);
    });

    it('lower', function(done) {
      equal('{{ "fOObAr" | lower }}', 'foobar');
      equal('{{ str | lower }}', {
        str: r.markSafe('fOObAr')
      }, 'foobar');
      equal('{{ null | lower }}', '');
      equal('{{ undefined | lower }}', '');
      equal('{{ nothing | lower }}', '');
      finish(done);
    });

    it('nl2br', function(done) {
      equal('{{ null | nl2br }}', '');
      equal('{{ undefined | nl2br }}', '');
      equal('{{ nothing | nl2br }}', '');
      equal('{{ str | nl2br }}', {
        str: r.markSafe('foo\r\nbar')
      }, 'foo<br />\nbar');
      equal('{{ str | nl2br }}', {
        str: r.markSafe('foo\nbar')
      }, 'foo<br />\nbar');
      equal('{{ str | nl2br }}', {
        str: r.markSafe('foo\n\nbar')
      }, 'foo<br />\n<br />\nbar');
      equal('{{ "foo\nbar" | nl2br }}', 'foo&lt;br /&gt;\nbar');
      finish(done);
    });

    it('random', function(done) {
      var i;
      for (i = 0; i < 100; i++) {
        render('{{ [1,2,3,4,5,6,7,8,9] | random }}', function(err, res) {
          var val = parseInt(res, 10);
          expect(val).to.be.within(1, 9);
        });
      }

      finish(done);
    });

    it('rejectattr', function(done) {
      var foods = [{
        tasty: true
      }, {
        tasty: false
      }, {
        tasty: true
      }];
      equal('{{ foods | rejectattr("tasty") | length }}', {
        foods: foods
      }, '1');
      finish(done);
    });

    it('selectattr', function(done) {
      var foods = [{
        tasty: true
      }, {
        tasty: false
      }, {
        tasty: true
      }];
      equal('{{ foods | selectattr("tasty") | length }}', {
        foods: foods
      }, '2');
      finish(done);
    });

    it('replace', function(done) {
      equal('{{ 123456 | replace("4", ".") }}', '123.56');
      equal('{{ 123456 | replace("4", ".") }}', '123.56');
      equal('{{ 12345.6 | replace("4", ".") }}', '123.5.6');
      equal('{{ 12345.6 | replace(4, ".") }}', '123.5.6');
      equal('{{ 12345.6 | replace("4", "7") }}', '12375.6');
      equal('{{ 12345.6 | replace(4, 7) }}', '12375.6');
      equal('{{ 123450.6 | replace(0, 7) }}', '123457.6');
      equal('{{ "aaabbbccc" | replace("", ".") }}', '.a.a.a.b.b.b.c.c.c.');
      equal('{{ "aaabbbccc" | replace(null, ".") }}', 'aaabbbccc');
      equal('{{ "aaabbbccc" | replace(undefined, ".") }}', 'aaabbbccc');
      equal('{{ "aaabbbccc" | replace({}, ".") }}', 'aaabbbccc');
      equal('{{ "aaabbbccc" | replace(true, ".") }}', 'aaabbbccc');
      equal('{{ "aaabbbccc" | replace(false, ".") }}', 'aaabbbccc');
      equal('{{ "aaabbbccc" | replace(["wrong"], ".") }}', 'aaabbbccc');
      equal('{{ "aaabbbccc" | replace("a", "x") }}', 'xxxbbbccc');
      equal('{{ "aaabbbccc" | replace("a", "x", 2) }}', 'xxabbbccc');
      equal('{{ "aaabbbbbccc" | replace("b", "y", 4) }}', 'aaayyyybccc');
      equal('{{ "aaabbbbbccc" | replace("", "") }}', 'aaabbbbbccc');
      equal('{{ "aaabbbbbccc" | replace("b", "") }}', 'aaaccc');
      equal('{{ "aaabbbbbccc" | replace("b", "", 4) }}', 'aaabccc');
      equal('{{ "aaabbbbbccc" | replace("ab", "y", 4) }}', 'aaybbbbccc');
      equal('{{ "aaabbbbbccc" | replace("b", "y", 4) }}', 'aaayyyybccc');
      equal('{{ "aaabbbbbccc" | replace("d", "y", 4) }}', 'aaabbbbbccc');
      equal('{{ "aaabbcccbbb" | replace("b", "y", 4) }}', 'aaayycccyyb');


      // Bad initial inputs
      equal('{{ undefined | replace("b", "y", 4) }}', '');
      equal('{{ null | replace("b", "y", 4) }}', '');
      equal('{{ {} | replace("b", "y", 4) }}', '[object Object]'); // End up with the object passed out of replace, then toString called on it
      equal('{{ [] | replace("b", "y", 4) }}', '');
      equal('{{ true | replace("rue", "afafasf", 4) }}', 'true');
      equal('{{ false | replace("rue", "afafasf", 4) }}', 'false');

      // Will result in an infinite loop if unbounded otherwise test will pass
      equal('{{ "<img src=" | replace("<img", "<img alt=val") | safe }}',
        '<img alt=val src=');
      equal('{{ "<img src=\\"http://www.example.com\\" />" | replace("<img", "replacement text") | safe }}',
        'replacement text src=\"http://www.example.com\" />');

      // Regex
      equal('{{ "aabbbb" | replace(r/ab{2}/, "z") }}', 'azbb');
      equal('{{ "aaaAAA" | replace(r/a/i, "z") }}', 'zaaAAA');
      equal('{{ "aaaAAA" | replace(r/a/g, "z") }}', 'zzzAAA');
      equal('{{ "aaaAAA" | replace(r/a/gi, "z") }}', 'zzzzzz');
      equal('{{ str | replace("a", "x") }}', {
        str: r.markSafe('aaabbbccc')
      }, 'xxxbbbccc');
      finish(done);
    });

    it('reverse', function(done) {
      equal('{{ "abcdef" | reverse }}', 'fedcba');
      equal('{% for i in [1, 2, 3, 4] | reverse %}{{ i }}{% endfor %}', '4321');
      finish(done);
    });

    it('round', function(done) {
      equal('{{ 4.5 | round }}', '5');
      equal('{{ 4.5 | round(0, "floor") }}', '4');
      equal('{{ 4.12345 | round(4) }}', '4.1235');
      equal('{{ 4.12344 | round(4) }}', ('4.1234'));
      finish(done);
    });

    it('slice', function(done) {
      var tmpl = '{% for items in arr | slice(3) %}' +
        '--' +
        '{% for item in items %}' +
        '{{ item }}' +
        '{% endfor %}' +
        '--' +
        '{% endfor %}';

      equal(tmpl,
        {
          arr: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        '--123----456----789--');

      equal(tmpl,
        {
          arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        '--1234----567----8910--');

      finish(done);
    });

    it('sum', function(done) {
      equal('{{ items | sum }}',
        {
          items: [1, 2, 3]
        },
        '6');

      equal('{{ items | sum("value") }}',
        {
          items: [{
            value: 1
          },
          {
            value: 2
          },
          {
            value: 3
          }]
        },
        '6');

      equal('{{ items | sum("value", 10) }}',
        {
          items: [
            {value: 1},
            {value: 2},
            {value: 3}
          ]
        },
        '16');

      finish(done);
    });

    it('sort', function(done) {
      equal('{% for i in [3,5,2,1,4,6] | sort %}{{ i }}{% endfor %}',
        '123456');

      equal('{% for i in ["fOo", "Foo"] | sort %}{{ i }}{% endfor %}',
        'fOoFoo');

      equal('{% for i in [1,6,3,7] | sort(true) %}{{ i }}{% endfor %}',
        '7631');

      equal('{% for i in ["fOo", "Foo"] | sort(false, true) %}{{ i }}{% endfor %}',
        'FoofOo');

      equal('{% for item in items | sort(false, false, "name") %}{{ item.name }}{% endfor %}',
        {
          items: [
            {name: 'james'},
            {name: 'fred'},
            {name: 'john'}
          ]
        },
        'fredjamesjohn');

      equal('{% for i in [ {n:3},{n:5},{n:2},{n:1},{n:4},{n:6}] | sort(attribute="n") %}{{ i.n }}{% endfor %}',
        '123456');

      finish(done);
    });

    it('string', function(done) {
      equal('{% for i in 1234 | string | list %}{{ i }},{% endfor %}',
        '1,2,3,4,');
      finish(done);
    });

    it('striptags', function(done) {
      equal('{{ html | striptags }}', {
        html: '<foo>bar'
      }, 'bar');
      equal('{{ html | striptags }}',
        {
          html: '  <p>an  \n <a href="#">example</a> link</p>\n<p>to a webpage</p> ' +
            '<!-- <p>and some comments</p> -->'
        },
        'an example link to a webpage');
      equal('{{ undefined | striptags }}', '');
      equal('{{ null | striptags }}', '');
      equal('{{ nothing | striptags }}', '');
      equal('{{ html | striptags(true) }}',
        {
          html: '<div>\n  row1\nrow2  \n  <strong>row3</strong>\n</div>\n\n' +
            ' HEADER \n\n<ul>\n  <li>option  1</li>\n<li>option  2</li>\n</ul>'
        },
        'row1\nrow2\nrow3\n\nHEADER\n\noption 1\noption 2');
      finish(done);
    });

    it('title', function(done) {
      equal('{{ "foo bar baz" | title }}', 'Foo Bar Baz');
      equal('{{ str | title }}', {
        str: r.markSafe('foo bar baz')
      }, 'Foo Bar Baz');
      equal('{{ undefined | title }}', '');
      equal('{{ null | title }}', '');
      equal('{{ nothing | title }}', '');
      finish(done);
    });

    it('trim', function(done) {
      equal('{{ "  foo " | trim }}', 'foo');
      equal('{{ str | trim }}', {
        str: r.markSafe('  foo ')
      }, 'foo');
      finish(done);
    });

    it('truncate', function(done) {
      equal('{{ "foo bar" | truncate(3) }}', 'foo...');
      equal('{{ "foo bar baz" | truncate(6) }}', 'foo...');
      equal('{{ "foo bar baz" | truncate(7) }}', 'foo bar...');
      equal('{{ "foo bar baz" | truncate(5, true) }}', 'foo b...');
      equal('{{ "foo bar baz" | truncate(6, true, "?") }}', 'foo ba?');
      equal('{{ "foo bar" | truncate(3) }}', {
        str: r.markSafe('foo bar')
      }, 'foo...');

      equal('{{ undefined | truncate(3) }}', '');
      equal('{{ undefined | truncate(6) }}', '');
      equal('{{ undefined | truncate(7) }}', '');
      equal('{{ undefined | truncate(5, true) }}', '');
      equal('{{ undefined | truncate(6, true, "?") }}', '');

      equal('{{ null | truncate(3) }}', '');
      equal('{{ null | truncate(6) }}', '');
      equal('{{ null | truncate(7) }}', '');
      equal('{{ null | truncate(5, true) }}', '');
      equal('{{ null | truncate(6, true, "?") }}', '');

      equal('{{ nothing | truncate(3) }}', '');
      equal('{{ nothing | truncate(6) }}', '');
      equal('{{ nothing | truncate(7) }}', '');
      equal('{{ nothing | truncate(5, true) }}', '');
      equal('{{ nothing | truncate(6, true, "?") }}', '');

      finish(done);
    });

    it('upper', function(done) {
      equal('{{ "foo" | upper }}', 'FOO');
      equal('{{ str | upper }}', {
        str: r.markSafe('foo')
      }, 'FOO');
      equal('{{ null | upper }}', '');
      equal('{{ undefined | upper }}', '');
      equal('{{ nothing | upper }}', '');
      finish(done);
    });

    it('urlencode', function(done) {
      equal('{{ "&" | urlencode }}', '%26');
      equal('{{ arr | urlencode | safe }}', {
        arr: [[1, 2], ['&1', '&2']]
      }, '1=2&%261=%262');
      equal('{{ obj | urlencode | safe }}', {
        obj: {
          1: 2,
          '&1': '&2'
        }
      }, '1=2&%261=%262');
      finish(done);
    });

    it('urlencode - object without prototype', function(done) {
      var obj = Object.create(null);
      obj['1'] = 2;
      obj['&1'] = '&2';

      equal('{{ obj | urlencode | safe }}', {
        obj: obj
      }, '1=2&%261=%262');
      finish(done);
    });

    it('urlize', function(done) {
      // from jinja test suite:
      // https://github.com/mitsuhiko/jinja2/blob/8db47916de0e888dd8664b2511e220ab5ecf5c15/jinja2/testsuite/filters.py#L236-L239
      equal('{{ "foo http://www.example.com/ bar" | urlize | safe }}',
        'foo <a href="http://www.example.com/">' +
        'http://www.example.com/</a> bar');

      // additional tests
      equal('{{ "" | urlize }}', '');
      equal('{{ "foo" | urlize }}', 'foo');

      // http
      equal('{{ "http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

      // https
      equal('{{ "https://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="https://jinja.pocoo.org/docs/templates/">https://jinja.pocoo.org/docs/templates/</a>');

      // www without protocol
      equal('{{ "www.pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="http://www.pocoo.org/docs/templates/">www.pocoo.org/docs/templates/</a>');

      // .org, .net, .com without protocol or www
      equal('{{ "pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="http://pocoo.org/docs/templates/">pocoo.org/docs/templates/</a>');
      equal('{{ "pocoo.net/docs/templates/" | urlize | safe }}',
        '<a href="http://pocoo.net/docs/templates/">pocoo.net/docs/templates/</a>');
      equal('{{ "pocoo.com/docs/templates/" | urlize | safe }}',
        '<a href="http://pocoo.com/docs/templates/">pocoo.com/docs/templates/</a>');
      equal('{{ "pocoo.com:80" | urlize | safe }}',
        '<a href="http://pocoo.com:80">pocoo.com:80</a>');
      equal('{{ "pocoo.com" | urlize | safe }}',
        '<a href="http://pocoo.com">pocoo.com</a>');
      equal('{{ "pocoo.commune" | urlize | safe }}',
        'pocoo.commune');

      // truncate the printed URL
      equal('{{ "http://jinja.pocoo.org/docs/templates/" | urlize(12, true) | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/" rel="nofollow">http://jinja</a>');

      // punctuation on the beginning of line.
      equal('{{ "(http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
      equal('{{ "<http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
      equal('{{ "&lt;http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

      // punctuation on the end of line
      equal('{{ "http://jinja.pocoo.org/docs/templates/," | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
      equal('{{ "http://jinja.pocoo.org/docs/templates/." | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
      equal('{{ "http://jinja.pocoo.org/docs/templates/)" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
      equal('{{ "http://jinja.pocoo.org/docs/templates/\n" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>\n');
      equal('{{ "http://jinja.pocoo.org/docs/templates/&gt;" | urlize | safe }}',
        '<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

      // http url with username
      equal('{{ "http://testuser@testuser.com" | urlize | safe }}',
        '<a href="http://testuser@testuser.com">http://testuser@testuser.com</a>');

      // email addresses
      equal('{{ "testuser@testuser.com" | urlize | safe }}',
        '<a href="mailto:testuser@testuser.com">testuser@testuser.com</a>');

      // periods in the text
      equal('{{ "foo." | urlize }}', 'foo.');
      equal('{{ "foo.foo" | urlize }}', 'foo.foo');

      // markup in the text
      equal('{{ "<b>what up</b>" | urlize | safe }}', '<b>what up</b>');

      // breaklines and tabs in the text
      equal('{{ "what\nup" | urlize | safe }}', 'what\nup');
      equal('{{ "what\tup" | urlize | safe }}', 'what\tup');

      finish(done);
    });

    it('wordcount', function(done) {
      equal('{{ "foo bar baz" | wordcount }}', '3');
      equal(
        '{{ str | wordcount }}',
        { str: r.markSafe('foo bar baz') },
        '3');
      equal('{{ null | wordcount }}', '');
      equal('{{ undefined | wordcount }}', '');
      equal('{{ nothing | wordcount }}', '');
      finish(done);
    });
  });
}());
