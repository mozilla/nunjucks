const nunjucks = require('../../index');
const listMarkdownFiles = require('../lib/list-markdown');
const templateMeta = require('../lib/template-metadata');
const renderMarkdown = require('../lib/markdown-to-html');
const getHeadings = require('../lib/get-headings');
const saveFile = require('../lib/save-file');
const copyFile = require('../lib/copy-file');

const baseDir = 'docs/';
const distDir = 'docs/files/';

// setup nunjunks environment
const renderer = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(baseDir, {
		noCache: true,
		watch: false
	}),
	{autoescape: false}
);

listMarkdownFiles()
	.map(file => templateMeta(file))
	.map(templateMeta => render(templateMeta))
	.map(template => saveFile(`${template.path}`, template.content));

saveFile(`${distDir}index.html`, renderer.render(`index.html`, { page: { pageid: 'home' } } ));

// copy remaining assets required for the docs
copyAssets();


/**
 * Returns object with markdown parsed to html and config to save the new file
 * @param  {Object} template Meta information of the markdown after been parsed by front-matter
 * @return {Object}
 */
function render(template) {
	return {
		content: renderTemplate(template),
		path: template.path.replace('.md', '.html').replace(baseDir, distDir)
	}
}

function renderTemplate(template) {
	const renderedMarkdown = renderMarkdown(template.body);
	const templateConfig = {
			content: renderedMarkdown,
			toc: renderTOC(renderedMarkdown),
			baseUrl: template.relativePath,
			page: {
				pageid: template.attributes.pageid || 'home',
				title: template.attributes.title,
				lang: template.attributes.lang
			}
		};
	return renderer.render(`_layouts/_subpage.html`, templateConfig);
}

function renderTOC(html) {
	const headings = getHeadings(html);
	const leveledHeadings = [];
	return headings;
}

function copyAssets() {
	return Promise.all([
		copyFile(`${baseDir}js/`, `${distDir}js/`),
		copyFile(`${baseDir}css/`, `${distDir}css/`),
		copyFile(`${baseDir}img/`, `${distDir}img/`),
		copyFile(`browser/`, `${distDir}files/`),
		// //temp until we remove bower dependecy
		copyFile(`${baseDir}bower_components/`, `${distDir}bower_components/`)
	]);
}
