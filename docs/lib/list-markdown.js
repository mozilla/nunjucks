const glob = require('glob');

const globConfig = '!(README.md)|**/*.md';
const basePath = 'docs/'

module.exports = function listMarkdown() {
	return glob.sync(`${basePath}${globConfig}`)
		.map(filename => filename);
};
