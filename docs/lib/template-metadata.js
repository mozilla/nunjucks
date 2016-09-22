const fs = require('fs')
const frontMatter = require('front-matter')

module.exports = function parseMarkdown(file) {
	const meta = frontMatter(fs.readFileSync(file, 'utf8'));
	return Object.assign({}, meta, {path: file});
}