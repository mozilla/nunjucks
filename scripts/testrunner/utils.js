'use strict';

const fs = require('fs');
const path = require('path');

function lookup(relPath, isExecutable) {
  for (let i = 0; i < module.paths.length; i++) {
    let absPath = path.join(module.paths[i], relPath);
    if (isExecutable && process.platform === 'win32') {
      absPath += '.cmd';
    }
    if (fs.existsSync(absPath)) {
      return absPath;
    }
  }
  return undefined;
}

module.exports = { lookup };
