var precompileString = require('../../index').precompileString;
var fs = require('fs');

var out = 'window.baseTmpl = ' +
precompileString(fs.readFileSync('views/base.njk', 'utf-8'), {
  name: 'base.njk',
  asFunction: true
});

out += 'window.aboutTmpl = ' +
precompileString(fs.readFileSync('views/about.njk', 'utf-8'), {
  name: 'about.njk',
  asFunction: true
});

fs.writeFileSync('js/templates.js', out, 'utf-8');
