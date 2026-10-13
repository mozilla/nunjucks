(function() {
  'use strict';

  var expect;
  var util;
  var Environment;
  var Loader;
  var templatesPath;
  var path;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
    Environment = require('../nunjucks/src/environment').Environment;
    Loader = require('../nunjucks/src/node-loaders').FileSystemLoader;
    templatesPath = 'tests/templates';
    path = require('path');
  } else {
    expect = window.expect;
    util = window.util;
    Environment = nunjucks.Environment;
    Loader = nunjucks.WebLoader;
    templatesPath = '../templates';
  }

  describe('api', function() {
    it('should not modify the options passed to an environment', function() {
      var tags = { variableStart: '[[', variableEnd: ']]' };
      var opts = {
        autoescape: null,
        dev: 1,
        trimBlocks: 1,
        tags: tags
      };
      var env = new Environment([], opts);

      expect(opts).to.eql({
        autoescape: null,
        dev: 1,
        trimBlocks: 1,
        tags: tags
      });
      expect(env.opts.autoescape).to.be(true);
      expect(env.opts.dev).to.be(true);
      expect(env.opts.trimBlocks).to.be(true);
      expect(env.opts.tags).to.be(tags);
      util.equal('[[ value ]]', { value: '<b>' }, {}, '&lt;b&gt;', env);
    });

    it('should accept frozen environment options', function() {
      var opts = Object.freeze({ autoescape: null, trimBlocks: true });
      var env = new Environment([], opts);

      expect(env.opts.autoescape).to.be(true);
      expect(env.opts.trimBlocks).to.be(true);
      util.equal('{{ value }}', { value: '<b>' }, {}, '&lt;b&gt;', env);
    });

    it('should keep environments independent when options are reused', function() {
      var opts = { autoescape: true };
      var escaped = new Environment([], opts);
      var unescaped;

      opts.autoescape = false;
      unescaped = new Environment([], opts);

      util.equal('{{ value }}', { value: '<b>' }, {}, '&lt;b&gt;', escaped);
      util.equal('{{ value }}', { value: '<b>' }, {}, '<b>', unescaped);

      unescaped.opts.autoescape = true;
      expect(opts.autoescape).to.be(false);
    });

    it('should always force compilation of parent template', function() {
      var env = new Environment(new Loader(templatesPath));

      var child = env.getTemplate('base-inherit.njk');
      expect(child.render()).to.be('Foo*Bar*BazFizzle');
    });

    it('should only call the callback once when conditional import fails', function(done) {
      var env = new Environment(new Loader(templatesPath));
      var called = 0;
      env.render('broken-conditional-include.njk',
        function() {
          expect(++called).to.be(1);
        }
      );
      setTimeout(done, 0);
    });


    it('should handle correctly relative paths', function() {
      var env;
      var child1;
      var child2;
      if (typeof path === 'undefined') {
        this.skip();
        return;
      }
      env = new Environment(new Loader(templatesPath));
      child1 = env.getTemplate('relative/test1.njk');
      child2 = env.getTemplate('relative/test2.njk');

      expect(child1.render()).to.be('FooTest1BazFizzle');
      expect(child2.render()).to.be('FooTest2BazFizzle');
    });

    it('should handle correctly cache for relative paths', function() {
      var env;
      var test;
      if (typeof path === 'undefined') {
        this.skip();
        return;
      }
      env = new Environment(new Loader(templatesPath));
      test = env.getTemplate('relative/test-cache.njk');

      expect(util.normEOL(test.render())).to.be('Test1\nTest2');
    });

    it('should handle correctly relative paths in renderString', function() {
      var env;
      if (typeof path === 'undefined') {
        this.skip();
        return;
      }
      env = new Environment(new Loader(templatesPath));
      expect(env.renderString('{% extends "./relative/test1.njk" %}{% block block1 %}Test3{% endblock %}', {}, {
        path: path.resolve(templatesPath, 'string.njk')
      })).to.be('FooTest3BazFizzle');
    });

    it('should emit "load" event on Environment instance', function(done) {
      var env = new Environment(new Loader(templatesPath));
      env.on('load', function(name, source) {
        expect(name).to.equal('item.njk');
        done();
      });
      env.render('item.njk', {});
    });
  });
}());
