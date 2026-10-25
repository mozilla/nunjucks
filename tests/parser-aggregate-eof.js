/* global describe, it */
/* eslint-disable global-require */
(function() {
  'use strict';

  if (typeof window !== 'undefined') {
    return;
  }

  const assert = require('assert');
  const path = require('path');
  const root = process.env.NUNJUCKS_SOURCE_ROOT || path.resolve(__dirname, '..');
  const parser = require(path.join(root, 'nunjucks/src/parser.js'));
  const lib = require(path.join(root, 'nunjucks/src/lib.js'));
  const Environment = require(path.join(root, 'nunjucks/src/environment.js')).Environment;

  function assertAggregateError(error) {
    assert.ok(error instanceof lib.TemplateError, 'Expected the real TemplateError');
    assert.ok(!(error instanceof TypeError), 'Do not leak a JavaScript null dereference');
    assert.match(error.message, /parseAggregate: unexpected end of file/);
    assert.ok(error.lineno > 0);
    assert.ok(error.colno > 0);
    return true;
  }

  describe('aggregate syntax errors at end of input', function() {
    const cases = [
      ['the original issue1454 input', '_•0]{{{{'],
      ['an unclosed group', '{{ ('],
      ['an unclosed empty array', '{{ ['],
      ['an unclosed empty dictionary', '{{ {'],
      ['an array after its first value', '{{ [1'],
      ['a dictionary after its first value', '{{ {"a": 1'],
      ['an outer array after a completed inner array', '{{ [ [1, 2]'],
      ['a group after its first expression', '{{ (1 + 2']
    ];

    cases.forEach(function(example) {
      it('reports TemplateError for ' + example[0], function() {
        assert.throws(function() {
          parser.parse(example[1]);
        }, assertAggregateError);
      });
    });

    it('points to the opening aggregate on a later line', function() {
      assert.throws(function() {
        parser.parse('first\nsecond\n{{ [');
      }, function(error) {
        assertAggregateError(error);
        assert.strictEqual(error.lineno, 3);
        assert.strictEqual(error.colno, 4);
        return true;
      });
    });

    it('preserves the aggregate diagnostic through synchronous rendering', function() {
      const env = new Environment([], {dev: true});
      assert.throws(function() {
        env.renderString('{{ [');
      }, function(error) {
        assertAggregateError(error);
        assert.match(error.message, /Line 1, Column 4/);
        return true;
      });
    });

    it('delivers the syntax error through the real render callback', function(done) {
      const env = new Environment([], {dev: true});
      env.renderString('{{ [', {}, function(error, result) {
        try {
          assertAggregateError(error);
          assert.strictEqual(result, undefined);
          done();
        } catch (failure) {
          done(failure);
        }
      });
    });

    it('preserves valid groups, arrays and dictionaries', function() {
      const env = new Environment([], {autoescape: false});
      const valid = [
        ['{{ (1 + 2) }}', '3'],
        ['{{ [] | dump }}', '[]'],
        ['{{ [1, 2] | dump }}', '[1,2]'],
        ['{{ {} | dump }}', '{}'],
        ['{{ {"a": 1} | dump }}', '{"a":1}'],
        ['{{ [[1, 2], 3] | dump }}', '[[1,2],3]'],
        // Whitespace between dictionary closers avoids the separate #1349 lexer root.
        ['{{ {"a": {"b": 2} } | dump }}', '{"a":{"b":2}}']
      ];
      valid.forEach(function(example) {
        assert.strictEqual(env.renderString(example[0]), example[1]);
      });
    });

    it('preserves existing non-EOF syntax error messages', function() {
      const invalid = [
        ['{{ [1 2] }}', /expected comma after expression/],
        ['{{ {"a" 1} }}', /expected colon after dict key/],
        ['hello {{ foo', /expected variable end/]
      ];
      invalid.forEach(function(example) {
        assert.throws(function() {
          parser.parse(example[0]);
        }, function(error) {
          assert.ok(error instanceof lib.TemplateError);
          assert.match(error.message, example[1]);
          return true;
        });
      });
    });
  });
}());
