const promisify = require('bluebird').promisify;
const copy = promisify(require('ncp').ncp);

module.exports = function (source, destination) {
	return copy(source, destination)
		.catch(err => console.error('error copying file', err));
};
