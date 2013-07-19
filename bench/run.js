var fs = require('fs');
var bench = require('bench');
var oldNunjucks = require('nunjucks');
var nunjucks = require('../index');

var env = new nunjucks.Environment();
var src = fs.readFileSync('case.html', 'utf-8');

exports.time = 1000;
exports.compareCount = 8;

exports.compare = {
    'old-nunjucks': function() {
        new oldNunjucks.Template(src, env, null, null, true);
    },

    'new-nunjucks': function() {
        new nunjucks.Template(src, env, null, null, true);
    }
};

// for(var i=0; i<10000; i++) {
//     new nunjucks.Template(src, env, null, null, true);
// }

bench.runMain();
