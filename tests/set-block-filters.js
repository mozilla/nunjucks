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
  const nunjucks = require(path.join(root, 'nunjucks/index.js'));

  function environment(autoescape) {
    return new nunjucks.Environment([], {autoescape: !!autoescape});
  }

  describe('filtered block assignments', function() {
    it('applies the issue1422 parameterized filter to the whole content', function() {
      const env = environment();
      const source = '{% set content | indent(2, true) %}alpha\nbeta{% endset %}{{ content }}';
      assert.strictEqual(env.renderString(source), '  alpha\n  beta');
    });

    it('evaluates a header chain in order with context arguments', function() {
      const env = environment();
      const calls = [];
      env.addFilter('wrap', function(value, left, right) {
        calls.push([value, left, right]);
        return left + value + right;
      });
      const source = '{% set x | trim | upper | wrap(left, right) %} hello {% endset %}{{ x }}';
      assert.strictEqual(env.renderString(source, {left: '[', right: ']'}), '[HELLO]');
      assert.deepStrictEqual(calls, [['HELLO', '[', ']']]);
    });

    it('computes filtered content once before assigning all targets', function() {
      const env = environment();
      let calls = 0;
      env.addFilter('counted', function(value) {
        calls += 1;
        return value.toUpperCase();
      });
      const source = '{% set x, y, z | counted %}hello{% endset %}{{ x }}:{{ y }}:{{ z }}';
      assert.strictEqual(env.renderString(source), 'HELLO:HELLO:HELLO');
      assert.strictEqual(calls, 1);
    });

    it('passes an empty capture to its header filter', function() {
      const env = environment();
      const calls = [];
      env.addFilter('bracket', function(value) {
        calls.push(value);
        return '[' + value + ']';
      });
      assert.strictEqual(env.renderString(
        '{% set x | bracket %}{% endset %}{{ x }}'), '[]');
      assert.deepStrictEqual(calls, ['']);
    });

    it('supports nested synchronous filtered captures', function() {
      const source = '{% set outer | trim %} {% set inner | upper %}hello{% endset %}' +
        '[{{ inner }}] {% endset %}{{ outer }}';
      assert.strictEqual(environment().renderString(source), '[HELLO]');
    });

    it('keeps assignments inside a macro scoped to that macro', function() {
      const source = '{% set x = "root" %}{% macro m() %}' +
        '{% set x | upper %}inner{% endset %}{{ x }}{% endmacro %}{{ m() }}:{{ x }}';
      assert.strictEqual(environment().renderString(source), 'INNER:root');
    });

    it('exports filtered top-level values using the existing Set mechanism', function(done) {
      const env = environment();
      const template = new nunjucks.Template(
        '{% set visible | upper %}hello{% endset %}' +
        '{% set _private | upper %}secret{% endset %}', env);
      template.getExported({}, function(error, values) {
        if (error) {
          done(error);
          return;
        }
        try {
          assert.strictEqual(values.visible, 'HELLO');
          assert.strictEqual(Object.prototype.hasOwnProperty.call(values, '_private'), false);
          done();
        } catch (failure) {
          done(failure);
        }
      });
    });

    it('preserves SafeString output and escaping inside the captured content', function() {
      const source = '{% set x | safe %}<b>{{ value }}</b>{% endset %}{{ x }}';
      assert.strictEqual(environment(true).renderString(source, {value: '<x>'}),
        '<b>&lt;x&gt;</b>');
    });

    it('awaits a real asynchronous header filter before assignment', function(done) {
      const env = environment();
      let calls = 0;
      env.addFilter('later', function(value, suffix, callback) {
        calls += 1;
        setImmediate(function() {
          callback(null, value.toUpperCase() + suffix);
        });
      }, true);
      env.renderString('{% set x, y | later(suffix) %}hello{% endset %}{{ x }}:{{ y }}',
        {suffix: '!'},
        function(error, result) {
          if (error) {
            done(error);
            return;
          }
          try {
            assert.strictEqual(result, 'HELLO!:HELLO!');
            assert.strictEqual(calls, 1);
            done();
          } catch (failure) {
            done(failure);
          }
        });
    });

    it('composes synchronous and asynchronous header filters in order', function(done) {
      const env = environment();
      const calls = [];
      env.addFilter('later', function(value, callback) {
        calls.push(value);
        setImmediate(function() {
          callback(null, '[' + value + ']');
        });
      }, true);
      env.renderString('{% set x | trim | upper | later | later %} hi {% endset %}{{ x }}',
        {},
        function(error, result) {
          if (error) {
            done(error);
            return;
          }
          try {
            assert.strictEqual(result, '[[HI]]');
            assert.deepStrictEqual(calls, ['HI', '[HI]']);
            done();
          } catch (failure) {
            done(failure);
          }
        });
    });

    it('propagates errors from a real asynchronous header filter', function(done) {
      const env = environment();
      env.addFilter('laterFail', function(value, callback) {
        setImmediate(function() {
          callback(new Error('header-filter-failure'));
        });
      }, true);
      env.renderString('{% set x | laterFail %}hello{% endset %}{{ x }}', {}, function(error, result) {
        try {
          assert.ok(error);
          assert.match(error.message, /header-filter-failure/);
          assert.strictEqual(result, undefined);
          done();
        } catch (failure) {
          done(failure);
        }
      });
    });

    it('preserves ordinary expression assignments as a control', function() {
      const source = '{% set x = " hello " | trim | upper %}{{ x }}';
      assert.strictEqual(environment().renderString(source), 'HELLO');
    });

    it('preserves ordinary asynchronous expression assignments as a control', function(done) {
      const env = environment();
      env.addFilter('later', function(value, callback) {
        setImmediate(function() {
          callback(null, value.toUpperCase());
        });
      }, true);
      env.renderString('{% set x = "hello" | later %}{{ x }}', {}, function(error, result) {
        if (error) {
          done(error);
          return;
        }
        try {
          assert.strictEqual(result, 'HELLO');
          done();
        } catch (failure) {
          done(failure);
        }
      });
    });

    it('preserves the unfiltered synchronous capture branch as a control', function() {
      const source = '{% set x, y %}a{% set z %}b{% endset %}{{ z }}{% endset %}{{ x }}:{{ y }}';
      assert.strictEqual(environment().renderString(source), 'ab:ab');
    });
  });
}());
