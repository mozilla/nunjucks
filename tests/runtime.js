(function() {
  'use strict';

  var expect, util, finish, render;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
  } else {
    expect = window.expect;
    util = window.util;
  }

  finish = util.finish;
  render = util.render;

  describe('runtime', function() {
    it('should report the failed function calls to symbols', function(done) {
      render('{{ foo("cvan") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/Unable to call `foo`, which is undefined/);
      });

      finish(done);
    });

    it('should report the failed function calls to lookups', function(done) {
      render('{{ foo["bar"]("cvan") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["bar"\]/);
      });

      finish(done);
    });

    it('should report the failed function calls to calls', function(done) {
      render('{{ foo.bar("second call") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["bar"\]/);
      });

      finish(done);
    });

    it('should report full function name in error', function(done) {
      render('{{ foo.barThatIsLongerThanTen() }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["barThatIsLongerThanTen"\]/);
      });

      finish(done);
    });

    it('should report the failed function calls w/multiple args', function(done) {
      render('{{ foo.bar("multiple", "args") }}', {}, {
        noThrow: true
      }, function(err) {
        expect(err).to.match(/foo\["bar"\]/);
      });

      render('{{ foo["bar"]["zip"]("multiple", "args") }}',
        {},
        {
          noThrow: true
        },
        function(err) {
          expect(err).to.match(/foo\["bar"\]\["zip"\]/);
        });

      finish(done);
    });

    it('should allow for undefined macro arguments in the last position', function(done) {
      render('{% macro foo(bar, baz) %}' +
        '{{ bar }} {{ baz }}{% endmacro %}' +
        '{{ foo("hello", nosuchvar) }}',
      {},
      {
        noThrow: true
      },
      function(err, res) {
        expect(err).to.equal(null);
        expect(typeof res).to.be('string');
      });

      finish(done);
    });

    it('should allow for objects without a prototype macro arguments in the last position', function(done) {
      var noProto = Object.create(null);
      noProto.qux = 'world';

      render('{% macro foo(bar, baz) %}' +
      '{{ bar }} {{ baz.qux }}{% endmacro %}' +
      '{{ foo("hello", noProto) }}',
      {
        noProto: noProto
      },
      {
        noThrow: true
      },
      function(err, res) {
        expect(err).to.equal(null);
        expect(res).to.equal('hello world');
      });

      finish(done);
    });

    it('should not read variables property from Object.prototype', function(done) {
      var payload = 'function(){ return 1+2; }()';
      var data = {};
      Object.getPrototypeOf(data).payload = payload;

      render('{{ payload }}', data, {
        noThrow: true
      }, function(err, res) {
        expect(err).to.equal(null);
        expect(res).to.equal(payload);
      });
      delete Object.getPrototypeOf(data).payload;

      finish(done);
    });
  });
}());
