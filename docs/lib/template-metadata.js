const fs = require('fs')
const frontMatter = require('front-matter')
const path = require('path');
module.exports = function parseMarkdown(file) {
	const meta = frontMatter(fs.readFileSync(file, 'utf8'));
	const relativePath = path.relative(file, 'docs/');
	return Object.assign({}, meta, {path: file, relativePath: relativePath});
}