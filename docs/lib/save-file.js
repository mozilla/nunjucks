const path = require('path');
const promisify = require('bluebird').promisify;
const createDir = promisify(require('mkdirp'));
const writeFile = promisify(require('fs').writeFile);

/**
 * Promisified fs.writeFile which creates missing directories.
 * @param {String} filename
 * @param contents
 * @returns {Promise}
 */
module.exports = function saveFile(filename, contents) {
	return createDir(path.dirname(filename))
		.then(() => writeFile(filename, contents));
};

