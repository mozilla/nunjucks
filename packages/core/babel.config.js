const path = require('path');

const baseConfig = require('../../babel.config');

module.exports = Object.assign({}, baseConfig, {
  env: {
    test: {
      plugins: [
        ['istanbul', {cwd: path.resolve('../..')}]
      ]
    }
  }
});
