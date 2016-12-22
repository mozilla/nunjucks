'use strict';

const marked = require('marked');
const renderCode = require('./render-code');

module.exports = function render(markdown) {
	let renderer = new marked.Renderer();
	renderer.code = renderCode;
	return marked(markdown, {renderer});
}
