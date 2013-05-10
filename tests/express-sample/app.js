
require(['nunjucks', 'templates'], function(nunjucks) {
    alert(nunjucks.env.getTemplate('index.html').render());
});