module.exports = renderCode;

const prism = require('prismjs');
prism.languages.html = require('./prism-twig'); // use twig (same syntax as nunjucks) as default formatter for html code

function renderCode(code, language) {
	if (prism.languages.hasOwnProperty(language)) {
		code = prism.highlight(code, prism.languages[language]);
		return `<pre class="language-${language}"><code>${code}</code></pre>`;
	} else {
		return `<pre class="language-unknown"><code>${code}</code></pre>`;
	}
}
