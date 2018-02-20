const fs = require('fs');
const path = require('path');
const precompile = require('../../nunjucks/src/precompile').precompile;

var testDir = path.join(__dirname, '../../tests');

function precompileTestTemplates() {
  return new Promise((resolve, reject) => {
    try {
      const output = precompile(path.join(testDir, 'templates'), {
        include: [/\.(njk|html)$/],
      });
      fs.writeFileSync(path.join(testDir, 'browser/precompiled-templates.js'), output);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = precompileTestTemplates;
