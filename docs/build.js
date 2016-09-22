const listMarkdownFiles = require('./lib/list-markdown');
const templateMeta = require('./lib/template-metadata');
const renderMarkdown = require('./lib/markdown-to-html');
const saveFile = require('./lib/save-file');
const copyFile = require('./lib/copy-file');

const nunjucks = require('../index');

const baseDir = 'docs/';
const distDir = 'docs/files/';

const renderer = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(baseDir, {
		noCache: true,
		watch: false
	}),
	{autoescape: false}
);

const config = {
	site: {
		baseurl: ''
	}
}

listMarkdownFiles()
	.map(file => templateMeta(file))
	.map(templateMeta => render(templateMeta))
	.map(template => saveFile(`${template.path}`, template.content));

saveFile(`${distDir}index.html`, renderer.render(`index.html`, config));

copyAssets();

function render(template) {
	if (template.attributes.layout) {
		return {
			content: renderTemplate(template),
			path: template.path.replace('.md', '.html').replace(baseDir, distDir)
		}
	}
}

function renderTemplate(template) {
	const templateConfig = Object.assign({},
		{
			content: renderMarkdown(template.body),
			page: {
				title: template.attributes.title
			}
		}, config);
	return renderer.render(`_layouts/${template.attributes.layout}.html`, templateConfig);
}

function copyAssets() {
	return Promise.all([
		copyFile(`${baseDir}js/`, `${distDir}js/`),
		copyFile(`${baseDir}css/`, `${distDir}css/`),
		copyFile(`${baseDir}img/`, `${distDir}img/`),
		// //temp until we remove bower dependecy
		copyFile(`${baseDir}bower_components/`, `${distDir}bower_components/`)
	]);

}