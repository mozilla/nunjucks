
var render = require('./util').render;

describe('filter', function() {
    // it('abs', function() {
    //     render('{{ -3|abs }}').should.equal('3');
    //     render('{{ -3.456|abs }}').should.equal('3.456');
    // });

    it('batch', function() {
        render('{% for a in [1,2,3,4,5,6]|batch(2) %}' +
               '-{% for b in a %}' +
               '{{ b }}' +
               '{% endfor %}-' +
               '{% endfor %}')
            .should.equal('-12--34--56-');
    });
});
