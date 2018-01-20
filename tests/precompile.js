(function() {
  'use strict';

  var expect,
    precompile,
    precompileString;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    precompile = require('../nunjucks/src/precompile').precompile;
    precompileString = require('../nunjucks/src/precompile').precompileString;
  } else {
    expect = window.expect;
    precompile = nunjucks.precompile;
    precompileString = nunjucks.precompileString;
  }

  describe('precompile', function() {
    it('should return a string', function() {
      expect(precompileString('{{ test }}', {
        name: 'test.njk'
      })).to.be.an('string');
    });

    describe('templates', function() {
      it('should return *NIX path seperators', function() {
        var fileName;

        precompile('./tests/templates/item.njk', {
          wrapper: function(templates) {
            fileName = templates[0].name;
          }
        });

        expect(fileName).to.equal('./tests/templates/item.njk');
      });

      it('should return *NIX path seperators, when name is passed as option', function() {
        var fileName;

        precompile('<span>test</span>', {
          name: 'path\\to\\file.j2',
          isString: true,
          wrapper: function(templates) {
            fileName = templates[0].name;
          }
        });

        expect(fileName).to.equal('path/to/file.j2');
      });
    });
  });
}());
