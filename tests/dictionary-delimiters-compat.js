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
  const lexer = nunjucks.lexer;
  const Parser = nunjucks.parser.Parser;
  const context = {arr: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']};

  function withCompat(run) {
    const uninstall = nunjucks.installJinjaCompat();
    try {
      return run(new nunjucks.Environment([], {autoescape: false}));
    } finally {
      uninstall();
    }
  }

  function remainingTypes(stream) {
    const result = [];
    let token;
    while ((token = stream.nextToken())) {
      if (token.type !== lexer.TOKEN_WHITESPACE) {
        result.push(token.type);
      }
    }
    return result;
  }

  describe('dictionary delimiter depth and Jinja slice backtracking', function() {
    it('restores depth when replaying a simple slice opening bracket', function() {
      withCompat(function(env) {
        assert.strictEqual(env.renderString('{{ arr[1:4] | join("") }}', context), 'bcd');
      });
    });

    it('preserves nested array bounds while replaying a slice', function() {
      withCompat(function(env) {
        const values = Object.assign({starts: [1], stops: [4]}, context);
        assert.strictEqual(env.renderString('{{ arr[starts[0]:stops[0]] | join("") }}', values), 'bcd');
      });
    });

    it('handles consecutive slice backtracking before a nested dictionary closes', function() {
      withCompat(function(env) {
        const source = '{{ {"outer":{"values":arr[1:7][::2]}} | dump }}';
        assert.strictEqual(env.renderString(source, context), '{"outer":{"values":["b","d","f"]}}');
      });
    });

    it('keeps positive and negative slices inside an outer aggregate balanced', function() {
      withCompat(function(env) {
        const source = '{{ [arr[1:4], arr[::-1]] | dump }}';
        const expected = [['b', 'c', 'd'], ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']];
        assert.strictEqual(env.renderString(source, context), JSON.stringify(expected));
      });
    });

    it('recognizes a custom variable end after a replayed slice closes', function() {
      withCompat(function() {
        const env = new nunjucks.Environment([], {
          autoescape: false,
          tags: {variableStart: '<<', variableEnd: ']]'}
        });
        assert.strictEqual(env.renderString('<< arr[1:4] | join("") ]]', context), 'bcd');
      });
    });

    it('restores the actual failure state when a malformed array is not a slice', function() {
      withCompat(function() {
        const stream = lexer.lex('{{ [1 2] }}');
        const parser = new Parser(stream);
        assert.throws(function() { parser.parseAsRoot(); }, /expected comma after expression/);
        assert.deepStrictEqual(remainingTypes(stream), [
          lexer.TOKEN_RIGHT_BRACKET, lexer.TOKEN_VARIABLE_END
        ]);
      });
    });

    it('preserves the failure state through nested non-slice rethrows', function() {
      withCompat(function() {
        const stream = lexer.lex('{{ {"a":[1 2]} }}');
        const parser = new Parser(stream);
        assert.throws(function() { parser.parseAsRoot(); }, /expected comma after expression/);
        assert.deepStrictEqual(remainingTypes(stream), [
          lexer.TOKEN_RIGHT_BRACKET, lexer.TOKEN_RIGHT_CURLY, lexer.TOKEN_VARIABLE_END
        ]);
      });
    });

    it('uninstalls compatibility hooks without changing normal dictionary rendering', function() {
      const original = Parser.prototype.parseAggregate;
      const originalLookup = nunjucks.runtime.memberLookup;
      const uninstall = nunjucks.installJinjaCompat();
      try {
        const env = new nunjucks.Environment([], {autoescape: false});
        assert.strictEqual(env.renderString('{{ arr[1:4] | join("") }}', context), 'bcd');
      } finally {
        uninstall();
      }
      assert.strictEqual(Parser.prototype.parseAggregate, original);
      assert.strictEqual(nunjucks.runtime.memberLookup, originalLookup);
      const env = new nunjucks.Environment([], {autoescape: false});
      assert.strictEqual(env.renderString('{{ {"a":{"b":2}} | dump }}'), '{"a":{"b":2}}');
      assert.throws(function() { env.renderString('{{ arr[1:4] }}', context); });
    });
  });
}());
