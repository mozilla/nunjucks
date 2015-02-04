var precompileString = require('../../index').precompileString;
var fs = require('fs');

var out = 'window.baseTmpl = ' + 
    precompileString(fs.readFileSync('views/base.html', 'utf-8'), {
        name: 'base.html',
        asFunction: true
    });

out += 'window.aboutTmpl = ' +
    precompileString(fs.readFileSync('views/about.html', 'utf-8'), {
        name: 'about.html',
        asFunction: true
    });

fs.writeFileSync('js/templates.js', out, 'utf-8');
