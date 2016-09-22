const promisify = require('bluebird').promisify;
const copy = promisify(require('ncp').ncp);

module.exports = function (source, destination) {
	return copy(source, destination)
		.catch(err => console.log('error copying file', err));
};
