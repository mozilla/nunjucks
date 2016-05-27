(function() {
    'use strict';

    var expect, precompile, precompileString;

    if(typeof require !== 'undefined') {
        expect = require('expect.js');
        precompile = require('../src/precompile').precompile;
        precompileString = require('../src/precompile').precompileString;
    }
    else {
        expect = window.expect;
        precompile = nunjucks.precompile;
        precompileString = nunjucks.precompileString;
    }

    describe('precompile', function() {
        it('should return a string', function() {
            expect(precompileString('{{ test }}', { name: 'test.j2' })).to.be.an('string');
        });

        describe('templates', function() {
            it('should return *NIX path seperators', function() {
                var fileName;

                precompile('./tests/templates/item.j2', {
                    wrapper: function(templates) {
                        fileName = templates[0].name;
                    }
                });

                expect(fileName).to.not.contain('\\');
            });
        });
    });
})();
