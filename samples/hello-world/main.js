const path = require('path');
const nunjucks = require('../..');

// Hello world example for nunjucks. This is meant to be run from nodejs.

const templateDirectory = path.join(__dirname, '/views');

// Configures nunjucks to look for templates in a specific directory,
// and turns different features on or off.
// see https://mozilla.github.io/nunjucks/api.html#configure
nunjucks.configure(templateDirectory, { autoescape: true });

// Renders the template and returns a string.
// The first argument is the template name to render.
// The second is the context object, used to pass variables into the template.
// see https://mozilla.github.io/nunjucks/api.html#render
const html = nunjucks.render('example.njk', {
  number: Math.ceil(Math.random() * 10)
});

// Outputs the final rendered text.
console.log(html);// eslint-disable-line no-console
