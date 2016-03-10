var precompileString = require('../../index').precompileString;
var fs = require('fs');

var out = 'window.baseTmpl = ' + 
    precompileString(fs.readFileSync('views/base.j2', 'utf-8'), {
        name: 'base.j2',
        asFunction: true
    });

out += 'window.aboutTmpl = ' +
    precompileString(fs.readFileSync('views/about.j2', 'utf-8'), {
        name: 'about.j2',
        asFunction: true
    });

fs.writeFileSync('js/templates.js', out, 'utf-8');
