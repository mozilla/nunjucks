const prism = require('prismjs');
require('prismjs/components/prism-twig'); // adds `twig` to global `prism.languages` instance

module.exports = (code, language) => {
	if (language === 'nunjucks' || language === 'njk' || language === 'jinja') { language = 'twig' };
    language = (prism.languages.hasOwnProperty(language)) ? language : 'markup';
    const formattedCode = prism.highlight(code, prism.languages[language]);
    return `<pre class="language-${language}"><code>${formattedCode}</code></pre>`;
};