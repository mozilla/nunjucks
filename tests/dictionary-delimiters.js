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
  const lexer = require(path.join(root, 'nunjucks/src/lexer.js'));

  function environment(options) {
    return new nunjucks.Environment([], Object.assign({autoescape: false}, options));
  }

  function tokens(source, options) {
    const stream = lexer.lex(source, options);
    const result = [];
    let token;
    while ((token = stream.nextToken())) {
      if (token.type !== lexer.TOKEN_WHITESPACE) {
        result.push(token);
      }
    }
    return result;
  }

  function toolEnvironment(options, received) {
    const env = environment(options);
    const extension = {
      tags: ['tool'],
      parse(parser, nodes) {
        const tag = parser.nextToken();
        const args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tag.value);
        return new nodes.CallExtension(this, 'run', args);
      },
      run(context, value) {
        received.push(value);
        return value.name + ':' + value.args.query;
      }
    };
    env.addExtension('Tool', extension);
    return env;
  }

  describe('dictionary closers and template end delimiters', function() {
    it('renders the exact nested dictionary expression from issue1349', function() {
      const source = '{{ ({"bar": 2, "baz": {"ham": 3}}) | dump }}';
      assert.strictEqual(environment().renderString(source), '{"bar":2,"baz":{"ham":3}}');
    });

    it('separates adjacent dictionary closers from an immediately following variable end', function() {
      const source = '{{{"x":{"y":1}}}}';
      assert.strictEqual(environment().renderString(source), '[object Object]');
    });

    it('handles three nested dictionaries before the actual variable end', function() {
      const source = '{{ {"a":{"b":{"c":3}}} | dump }}';
      assert.strictEqual(environment().renderString(source), '{"a":{"b":{"c":3}}}');
    });

    it('passes the reported custom-tag dictionary through real parseSignature', function() {
      const received = [];
      const env = toolEnvironment({}, received);
      const source = '{%tool {"name":"documents.search","args":{"query":"question"}} %}';
      assert.strictEqual(env.renderString(source), 'documents.search:question');
      assert.deepStrictEqual(received, [{name: 'documents.search', args: {query: 'question'}}]);
    });

    it('supports dictionaries in an ordinary block assignment', function() {
      const source = '{% set x = {"a":{"b":2}} %}{{ x.a.b }}';
      assert.strictEqual(environment().renderString(source), '2');
    });

    it('emits both dictionary closing tokens before the real tag end', function() {
      const result = tokens('{{ {"outer":{"inner":1}} }}');
      assert.deepStrictEqual(result.map(function(token) { return token.type; }), [
        lexer.TOKEN_VARIABLE_START,
        lexer.TOKEN_LEFT_CURLY, lexer.TOKEN_STRING, lexer.TOKEN_COLON,
        lexer.TOKEN_LEFT_CURLY, lexer.TOKEN_STRING, lexer.TOKEN_COLON, lexer.TOKEN_INT,
        lexer.TOKEN_RIGHT_CURLY, lexer.TOKEN_RIGHT_CURLY,
        lexer.TOKEN_VARIABLE_END
      ]);
    });

    const customVariables = [
      ['array brackets', ']]', '[[1,2],[3]]', '[[1,2],[3]]'],
      ['group parentheses', '))', '((1 + 2))', '3'],
      ['dictionary braces', '}}', '{"a":{"b":2}}', '{"a":{"b":2}}']
    ];
    customVariables.forEach(function(example) {
      it('preserves a custom variable end that collides with ' + example[0], function() {
        const env = environment({tags: {variableStart: '<<', variableEnd: example[1]}});
        const source = '<< ' + example[2] + ' | dump ' + example[1];
        assert.strictEqual(env.renderString(source), example[3]);
      });
    });

    it('keeps custom block ends separate from adjacent dictionary closers', function() {
      const received = [];
      const env = toolEnvironment({tags: {blockStart: '<%', blockEnd: '}}'}}, received);
      const source = '<%tool {"name":"documents.search","args":{"query":"question"}} }}';
      assert.strictEqual(env.renderString(source), 'documents.search:question');
      assert.strictEqual(received.length, 1);
    });

    it('keeps custom block ends separate from nested array closers', function() {
      const env = environment({tags: {blockStart: '[%', blockEnd: ']]'}});
      const source = '[% set x = [[1,2],[3]] ]]{{ x | dump }}';
      assert.strictEqual(env.renderString(source), '[[1,2],[3]]');
    });

    it('does not count brackets or end delimiters inside string literals', function() {
      const value = '}}%}([[{';
      const source = '{{ {"value":' + JSON.stringify(value) + ',"nested":{"v":1}} | dump }}';
      assert.strictEqual(environment().renderString(source),
        JSON.stringify({value: value, nested: {v: 1}}));
    });

    it('does not count brackets after escaped quotes inside strings', function() {
      const value = '"}([[';
      const source = '{{ {"value":' + JSON.stringify(value) + ',"nested":{"v":1}} | dump }}';
      assert.strictEqual(environment().renderString(source),
        JSON.stringify({value: value, nested: {v: 1}}));
    });

    it('does not count braces inside regex literals', function() {
      const source = '{{ {"pattern":r/[}]/,"nested":{"v":1}} | dump }}';
      assert.strictEqual(environment().renderString(source), '{"pattern":{},"nested":{"v":1}}');
      const result = tokens(source);
      const regex = result.filter(function(token) { return token.type === lexer.TOKEN_REGEX; });
      assert.strictEqual(regex.length, 1);
      assert.strictEqual(regex[0].value.body, '[}]');
      assert.strictEqual(result.filter(function(token) {
        return token.type === lexer.TOKEN_VARIABLE_END;
      }).length, 1);
    });

    it('preserves explicit variable whitespace-control markers', function() {
      const source = 'A \n{{- {"x":{"y":2}} | dump -}}\n B';
      assert.strictEqual(environment().renderString(source), 'A{"x":{"y":2}}B');
    });

    it('preserves trimBlocks and lstripBlocks around nested dictionaries', function() {
      const env = environment({trimBlocks: true, lstripBlocks: true});
      const source = 'before\n  {% set x = {"a":{"b":2}} %}\n{{ x.a.b }}';
      assert.strictEqual(env.renderString(source), 'before\n2');
    });

    it('does not carry aggregate depth into following tags', function() {
      const source = '{{ {"a":{"b":1}} | dump }}{{2}}' +
        '{% set x = {"c":{"d":3}} %}{{x.c.d}}';
      assert.strictEqual(environment().renderString(source), '{"a":{"b":1}}23');
    });

    it('preserves the raw-content bypass as a control', function() {
      const raw = '{{ {"x":{}} }}';
      const source = '{% raw %}' + raw + '{% endraw %}{{ 2 }}';
      assert.strictEqual(environment().renderString(source), raw + '2');
    });

    it('preserves plain delimiters and spaced dictionary closers as controls', function() {
      const env = environment();
      assert.strictEqual(env.renderString('A{{ 1 }}B{% if true %}C{% endif %}'), 'A1BC');
      assert.strictEqual(env.renderString('{{ {"a":{"b":2} } | dump }}'), '{"a":{"b":2}}');
      assert.strictEqual(env.renderString('{{ "]]}" }}'), ']]}');
      assert.strictEqual(env.renderString('{{ r/[}]/.source }}'), '[}]');
    });

    it('still rejects malformed expressions instead of accepting an unclosed aggregate', function() {
      const env = environment();
      ['{{ {"a": } }}', '{{ [1, 2 }}'].forEach(function(source) {
        assert.throws(function() { env.renderString(source); });
      });
    });

    it('renders the original expression through the actual callback entry', function(done) {
      environment().renderString('{{ ({"bar":2,"baz":{"ham":3}}) | dump }}', {}, function(error, result) {
        if (error) {
          done(error);
          return;
        }
        try {
          assert.strictEqual(result, '{"bar":2,"baz":{"ham":3}}');
          done();
        } catch (failure) {
          done(failure);
        }
      });
    });
  });
}());
