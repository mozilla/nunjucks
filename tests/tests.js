(function() {
  'use strict';

  var expect, util, render, equal;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
  } else {
    expect = window.expect;
    util = window.util;
  }

  render = util.render;
  equal = util.equal;

  describe('tests', function() {
    it('callable should detect callability', function() {
      var callable = render('{{ foo is callable }}', {
        foo: function() {
          return '!!!';
        }
      });
      var uncallable = render('{{ foo is not callable }}', {
        foo: '!!!'
      });
      expect(callable).to.be('true');
      expect(uncallable).to.be('true');
    });

    it('defined should detect definedness', function() {
      expect(render('{{ foo is defined }}')).to.be('false');
      expect(render('{{ foo is not defined }}')).to.be('true');
      expect(render('{{ foo is defined }}', {
        foo: null
      })).to.be('true');
      expect(render('{{ foo is not defined }}', {
        foo: null
      })).to.be('false');
    });

    it('should support "is defined" in {% if %} expressions', function() {
      expect(
        render('{% if foo is defined %}defined{% else %}undefined{% endif %}',
          {})
      ).to.be('undefined');
      expect(
        render('{% if foo is defined %}defined{% else %}undefined{% endif %}',
          {foo: null})
      ).to.be('defined');
    });

    it('should support "is not defined" in {% if %} expressions', function() {
      expect(
        render('{% if foo is not defined %}undefined{% else %}defined{% endif %}',
          {})
      ).to.be('undefined');
      expect(
        render('{% if foo is not defined %}undefined{% else %}defined{% endif %}',
          {foo: null})
      ).to.be('defined');
    });

    it('undefined should detect undefinedness', function() {
      expect(render('{{ foo is undefined }}')).to.be('true');
      expect(render('{{ foo is not undefined }}')).to.be('false');
      expect(render('{{ foo is undefined }}', {
        foo: null
      })).to.be('false');
      expect(render('{{ foo is not undefined }}', {
        foo: null
      })).to.be('true');
    });

    it('none/null should detect strictly null values', function() {
      // required a change in lexer.js @ 220
      expect(render('{{ null is null }}')).to.be('true');
      expect(render('{{ none is none }}')).to.be('true');
      expect(render('{{ none is null }}')).to.be('true');
      expect(render('{{ foo is null }}')).to.be('false');
      expect(render('{{ foo is not null }}', {
        foo: null
      })).to.be('false');
    });

    it('divisibleby should detect divisibility', function() {
      var divisible = render('{{ "6" is divisibleby(3) }}');
      var notDivisible = render('{{ 3 is not divisibleby(2) }}');
      expect(divisible).to.be('true');
      expect(notDivisible).to.be('true');
    });

    it('escaped should test whether or not something is escaped', function() {
      var escaped = render('{{ (foo | safe) is escaped }}', {
        foo: 'foobarbaz'
      });
      var notEscaped = render('{{ foo is escaped }}', {
        foo: 'foobarbaz'
      });
      expect(escaped).to.be('true');
      expect(notEscaped).to.be('false');
    });

    it('even should detect whether or not a number is even', function() {
      var fiveEven = render('{{ "5" is even }}');
      var fourNotEven = render('{{ 4 is not even }}');
      expect(fiveEven).to.be('false');
      expect(fourNotEven).to.be('false');
    });

    it('odd should detect whether or not a number is odd', function() {
      var fiveOdd = render('{{ "5" is odd }}');
      var fourNotOdd = render('{{ 4 is not odd }}');
      expect(fiveOdd).to.be('true');
      expect(fourNotOdd).to.be('true');
    });

    it('mapping should detect Maps or hashes', function() {
      /* global Map */
      var map1, map2, mapOneIsMapping, mapTwoIsMapping;
      if (typeof Map === 'undefined') {
        this.skip();
      } else {
        map1 = new Map();
        map2 = {};
        mapOneIsMapping = render('{{ map is mapping }}', {
          map: map1
        });
        mapTwoIsMapping = render('{{ map is mapping }}', {
          map: map2
        });
        expect(mapOneIsMapping).to.be('true');
        expect(mapTwoIsMapping).to.be('true');
      }
    });

    it('falsy should detect whether or not a value is falsy', function() {
      var zero = render('{{ 0 is falsy }}');
      var pancakes = render('{{ "pancakes" is not falsy }}');
      expect(zero).to.be('true');
      expect(pancakes).to.be('true');
    });

    it('truthy should detect whether or not a value is truthy', function() {
      var nullTruthy = render('{{ null is truthy }}');
      var pancakesNotTruthy = render('{{ "pancakes" is not truthy }}');
      expect(nullTruthy).to.be('false');
      expect(pancakesNotTruthy).to.be('false');
    });

    it('greaterthan than should detect whether or not a value is less than another', function() {
      var fiveGreaterThanFour = render('{{ "5" is greaterthan(4) }}');
      var fourNotGreaterThanTwo = render('{{ 4 is not greaterthan(2) }}');
      expect(fiveGreaterThanFour).to.be('true');
      expect(fourNotGreaterThanTwo).to.be('false');
    });

    it('ge should detect whether or not a value is greater than or equal to another', function() {
      var fiveGreaterThanEqualToFive = render('{{ "5" is ge(5) }}');
      var fourNotGreaterThanEqualToTwo = render('{{ 4 is not ge(2) }}');
      expect(fiveGreaterThanEqualToFive).to.be('true');
      expect(fourNotGreaterThanEqualToTwo).to.be('false');
    });

    it('lessthan than should detect whether or not a value is less than another', function() {
      var fiveLessThanFour = render('{{ "5" is lessthan(4) }}');
      var fourNotLessThanTwo = render('{{ 4 is not lessthan(2) }}');
      expect(fiveLessThanFour).to.be('false');
      expect(fourNotLessThanTwo).to.be('true');
    });

    it('le should detect whether or not a value is less than or equal to another', function() {
      var fiveLessThanEqualToFive = render('{{ "5" is le(5) }}');
      var fourNotLessThanEqualToTwo = render('{{ 4 is not le(2) }}');
      expect(fiveLessThanEqualToFive).to.be('true');
      expect(fourNotLessThanEqualToTwo).to.be('true');
    });

    it('ne should detect whether or not a value is not equal to another', function() {
      var five = render('{{ 5 is ne(5) }}');
      var four = render('{{ 4 is not ne(2) }}');
      expect(five).to.be('false');
      expect(four).to.be('false');
    });

    it('iterable should detect that a generator is iterable', function(done) {
      /* eslint-disable no-eval */
      var iterable;
      try {
        iterable = eval('(function* iterable() { yield true; })()');
      } catch (e) {
        return this.skip(); // Browser does not support generators
      }
      equal('{{ fn is iterable }}', { fn: iterable }, 'true');
      return done();
    });

    it('iterable should detect that an Array is not non-iterable', function() {
      equal('{{ arr is not iterable }}', { arr: [] }, 'false');
    });

    it('iterable should detect that a Map is iterable', function() {
      if (typeof Map === 'undefined') {
        this.skip();
      } else {
        equal('{{ map is iterable }}', { map: new Map() }, 'true');
      }
    });

    it('iterable should detect that a Set is not non-iterable', function() {
      /* global Set */
      if (typeof Set === 'undefined') {
        this.skip();
      } else {
        equal('{{ set is not iterable }}', { set: new Set() }, 'false');
      }
    });

    it('number should detect whether a value is numeric', function() {
      var num = render('{{ 5 is number }}');
      var str = render('{{ "42" is number }}');
      expect(num).to.be('true');
      expect(str).to.be('false');
    });

    it('string should detect whether a value is a string', function() {
      var num = render('{{ 5 is string }}');
      var str = render('{{ "42" is string }}');
      expect(num).to.be('false');
      expect(str).to.be('true');
    });

    it('equalto should detect value equality', function() {
      var same = render('{{ 1 is equalto(2) }}');
      var notSame = render('{{ 2 is not equalto(2) }}');
      expect(same).to.be('false');
      expect(notSame).to.be('false');
    });

    it('sameas should alias to equalto', function() {
      var obj = {};
      var same = render('{{ obj1 is sameas(obj2) }}', {
        obj1: obj,
        obj2: obj
      });
      expect(same).to.be('true');
    });

    it('lower should detect whether or not a string is lowercased', function() {
      expect(render('{{ "foobar" is lower }}')).to.be('true');
      expect(render('{{ "Foobar" is lower }}')).to.be('false');
    });

    it('upper should detect whether or not a string is uppercased', function() {
      expect(render('{{ "FOOBAR" is upper }}')).to.be('true');
      expect(render('{{ "Foobar" is upper }}')).to.be('false');
    });
  });
}());
