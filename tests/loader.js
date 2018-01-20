(function() {
  'use strict';

  var expect,
    Environment,
    WebLoader,
    FileSystemLoader,
    templatesPath;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    Environment = require('../nunjucks/src/environment').Environment;
    WebLoader = require('../nunjucks/src/web-loaders').WebLoader;
    FileSystemLoader = require('../nunjucks/src/node-loaders').FileSystemLoader;
    templatesPath = 'tests/templates';
  } else {
    expect = window.expect;
    Environment = nunjucks.Environment;
    WebLoader = nunjucks.WebLoader;
    FileSystemLoader = nunjucks.FileSystemLoader;
    templatesPath = '../templates';
  }

  describe('loader', function() {
    it('should have default opts for WebLoader', function() {
      var webLoader = new WebLoader(templatesPath);
      expect(webLoader).to.be.a(WebLoader);
      expect(webLoader.useCache).to.be(false);
      expect(webLoader.async).to.be(false);
    });

    if (typeof FileSystemLoader !== 'undefined') {
      it('should have default opts for FileSystemLoader', function() {
        var fileSystemLoader = new FileSystemLoader(templatesPath);
        expect(fileSystemLoader).to.be.a(FileSystemLoader);
        expect(fileSystemLoader.noCache).to.be(false);
      });
    }

    it('should allow a simple loader to be created', function() {
      // From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
      // We should be able to create a loader that only exposes getSource
      var env, parent;

      function MyLoader() {
        // configuration
      }

      MyLoader.prototype.getSource = function() {
        return {
          src: 'Hello World',
          path: '/tmp/somewhere'
        };
      };

      env = new Environment(new MyLoader(templatesPath));
      parent = env.getTemplate('fake.njk');
      expect(parent.render()).to.be('Hello World');
    });

    it('should catch loader error', function(done) {
      // From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
      // We should be able to create a loader that only exposes getSource
      var env;

      function MyLoader() {
        // configuration
        this.async = true;
      }

      MyLoader.prototype.getSource = function(s, cb) {
        setTimeout(function() {
          cb(new Error('test'));
        }, 1);
      };

      env = new Environment(new MyLoader(templatesPath));
      env.getTemplate('fake.njk', function(err, parent) {
        expect(err).to.be.a(Error);
        expect(parent).to.be(undefined);

        done();
      });
    });
  });
}());
