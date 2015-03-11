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
        precompileString = nunjucks.precompileString
    }

    describe('precompile', function() {
        it('should return a string', function() {
            expect(precompileString("{{ test }}", { name: "test.html" })).to.be.an('string');
        });
    });
})();
